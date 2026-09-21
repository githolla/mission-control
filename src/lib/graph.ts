// The company as a graph. Every node is a real record from src/data.ts (or a
// deterministic, named signal derived from one) and every edge is a real
// relationship: project ↔ team, mission → owner, decision → what it protects,
// signal → the mission it was ingested against. No random dots.

import {
  projects,
  missions,
  teams,
  decisions,
  gates,
  flightReadiness,
  knowledge,
  recommendations,
  projectFor,
  type Project,
  type Mission,
} from '../data'
import { detectAnomalies, forecastProject } from './intel'

export type NodeType =
  | 'project'
  | 'mission'
  | 'team'
  | 'person'
  | 'decision'
  | 'gate'
  | 'station'
  | 'doc'
  | 'anomaly'
  | 'action'
  | 'signal'
  | 'ambient'

export type GraphNode = {
  id: string
  type: NodeType
  label: string
  sub?: string
  desc?: string
  to?: string
  size: number
  color: string
  ring?: boolean // pinned on the outer ring
  meta?: { k: string; v: string }[]
  group?: string // project id this node orbits, for initial placement
}

export type GraphLink = { source: string; target: string; kind: string }

export const typeMeta: Record<NodeType, { label: string; color: string; size: number }> = {
  project: { label: 'Projects', color: '#f2a93b', size: 13 },
  team: { label: 'Teams', color: '#a78bfa', size: 11 },
  mission: { label: 'Missions', color: '#6fb1ff', size: 7 },
  person: { label: 'People', color: '#e8edf8', size: 3.6 },
  decision: { label: 'Decisions', color: '#f472b6', size: 7 },
  gate: { label: 'Gates', color: '#fde68a', size: 5.5 },
  station: { label: 'Stations', color: '#9cc7ff', size: 5.5 },
  doc: { label: 'Knowledge', color: '#74dcb6', size: 5 },
  anomaly: { label: 'Anomalies', color: '#e07070', size: 6 },
  action: { label: 'AI actions', color: '#c4b5fd', size: 5.5 },
  signal: { label: 'Signals', color: '#8b93a7', size: 2.3 },
  ambient: { label: 'Ambient', color: '#6b7590', size: 2 },
}

const sourceColor: Record<string, string> = {
  Jira: '#4c9aff',
  GitHub: '#c9d1d9',
  Slack: '#e8a2c7',
  Email: '#f2c94c',
  Calendar: '#7ee787',
  'Lab log': '#ff9f43',
  Supplier: '#ff7b7b',
  Docs: '#74dcb6',
  'Test rig': '#9be7ff',
}

const ambientColor: Record<string, string> = {
  Market: '#fbbf24',
  Research: '#74dcb6',
  Regulatory: '#f472b6',
  Supplier: '#ff7b7b',
  Hiring: '#7ee787',
  Customer: '#6fb1ff',
  Competitor: '#c4b5fd',
  Press: '#e8edf8',
}

/* deterministic PRNG so the graph is identical on every load */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)]
}

const personId = (name: string) => `person:${name.toLowerCase().replace(/[^a-z]+/g, '-')}`
const statusWord = (s: string) => s.replace('-', ' ')

/* ── signal templates: what the AI ingested against each mission / project ── */
const signalTemplates: { src: string; t: string[] }[] = [
  { src: 'Jira', t: ['{KEY}-{n} · {topic} tolerance rework', '{KEY}-{n} · {topic} test failure triage', '{KEY}-{n} · {topic} spec update', '{KEY}-{n} · {topic} blocker cleared', '{KEY}-{n} · {topic} regression'] },
  { src: 'GitHub', t: ['PR #{n} · {topic} firmware patch', 'PR #{n} · {topic} calibration script', 'Commit {h} · {topic} config', 'Issue #{n} · {topic} flaky test'] },
  { src: 'Slack', t: ['#{ch} · {topic} stand-up note', '#{ch} · {topic} question from {who}', '#{ch} · {topic} decision thread', '#{ch} · {topic} risk raised'] },
  { src: 'Email', t: ['{who} · {topic} status update', '{who} · {topic} vendor quote', '{who} · {topic} review invite'] },
  { src: 'Calendar', t: ['{topic} design review', '{topic} sync · {who}', '{topic} readiness poll', '{topic} rehearsal'] },
  { src: 'Lab log', t: ['Run {n} · {topic} measurement', 'Run {n} · {topic} calibration drift', 'Run {n} · {topic} thermal soak'] },
  { src: 'Supplier', t: ['{vendor} · {topic} lead time notice', '{vendor} · {topic} shipment ETA', '{vendor} · {topic} quality cert'] },
  { src: 'Docs', t: ['{topic} test plan v{v}', '{topic} risk register entry', '{topic} runbook change'] },
  { src: 'Test rig', t: ['Rig {r} · {topic} EMC sweep', 'Rig {r} · {topic} vibration profile', 'Rig {r} · {topic} soak result'] },
]
const topics: Record<string, string[]> = {
  'p-sensor': ['magnetometer', 'sensor array', 'field trial', 'shielding', 'noise floor'],
  'p-photon': ['photon source', 'yield', 'line 2', 'packaging', 'wafer lot'],
  'p-cryo': ['cryostat', 'partner demo', 'mK stability', 'install', 'support window'],
  'p-neutron': ['laser target', 'neutron flux', 'ALLS beamtime', 'moderator', 'detector'],
  'p-proto': ['enclosure', 'DVT build', 'supplier bracket', 'v2 bring-up', 'cert sample'],
  'p-materials': ['characterization', 'benchmark 4', 'sample prep', 'cryo-stage', 'go/no-go pack'],
}
const keys: Record<string, string> = { 'p-sensor': 'QSA', 'p-photon': 'SPX', 'p-cryo': 'CRX', 'p-neutron': 'CNS', 'p-proto': 'PV2', 'p-materials': 'QMP' }
const vendors = ['Nordic Precision', 'Helix Components', 'Aurora Optics', 'Meridian Cryo', 'Kestrel Machining']
const channels = ['eng-prototype', 'ops-line2', 'commercial-demo', 'cert', 'neutron-alls', 'materials']
const times = ['2 min ago', '14 min ago', '41 min ago', '1 h ago', '3 h ago', 'this morning', 'yesterday', '2 days ago']

function fill(r: () => number, t: string, pid: string, who: string[]) {
  return t
    .replace('{KEY}', keys[pid] ?? 'ENG')
    .replace('{n}', String(1000 + Math.floor(r() * 900)))
    .replace('{h}', Math.floor(r() * 0xfffff).toString(16).padStart(5, '0'))
    .replace('{topic}', pick(r, topics[pid] ?? ['integration']))
    .replace('{who}', pick(r, who))
    .replace('{vendor}', pick(r, vendors))
    .replace('{ch}', pick(r, channels))
    .replace('{v}', String(1 + Math.floor(r() * 4)))
    .replace('{r}', String(1 + Math.floor(r() * 3)))
    .replace(/^\w/, (c) => c.toUpperCase())
}

/* ── ambient ring: signals the AI is watching but has not linked to a mission ── */
const ambientTemplates: Record<string, string[]> = {
  Market: ['Quantum sensing TAM revision', 'Photonics demand index +{n}%', 'Cryo services pricing survey', 'NDT imaging market note', 'Defense procurement outlook'],
  Research: ['arXiv · laser-driven neutron sources', 'Nature · {n}% purity single-photon', 'Preprint · quantum magnetometry', 'Review · cryogenic control loops', 'Thesis · materials benchmarks'],
  Regulatory: ['Export-control update {n}', 'Radiation safety guidance', 'ISO 17025 revision', 'EMC standard amendment', 'Lab licensing notice'],
  Supplier: ['{vendor} capacity alert', '{vendor} price list', '{vendor} audit result', 'Alt-supplier shortlist', 'Freight index week {n}'],
  Hiring: ['Inbound · firmware lead', 'Inbound · cryo technician', 'Referral · test engineer', 'Offer · data platform', 'Pipeline · Q4 roles'],
  Customer: ['Install {n} · uptime ping', 'Support ticket · CRX-{n}', 'NPS response · QSA', 'Renewal signal · partner', 'Field note · site {n}'],
  Competitor: ['Competitor launch teardown', 'Patent filing · sensor array', 'Funding round · photonics', 'Conference abstract', 'Hiring spike · rival'],
  Press: ['Coverage · neutron record', 'Analyst mention', 'Podcast request', 'Award shortlist', 'Trade-show invite'],
}

/* ── decision / doc / station wiring (narrative relationships) ── */
const decisionLinks: Record<string, string[]> = {
  'd-supplier': ['p-proto', 'm-proto'],
  'd-allocation': ['p-proto', 'p-cryo', 'team:engineering', 'm-demo'],
  'd-budget': ['m-cert', 'station:Finance', 'm-brand'],
}
const docLinks: Record<string, string[]> = {
  k1: ['p-sensor', 'p-photon', 'p-cryo', 'p-neutron', 'p-proto', 'p-materials'],
  k2: ['p-proto', 'm-proto'],
  k3: ['m-demo', 'p-cryo'],
  k4: ['team:operations', 'm-mfg', 'm-hire', 'm-cost'],
  k5: ['m-proto', 'm-cert'],
  k6: ['d-supplier', 'd-budget', 'p-neutron'],
}
const gateLinks: Record<string, string[]> = { 'g-demo': ['m-demo', 'p-cryo'], 'g-proto': ['m-proto', 'p-proto'], 'g-hiring': ['m-hire'], 'g-cert': ['m-cert'] }
const stationLinks: Record<string, string[]> = {
  Engineering: ['team:engineering', 'm-proto'],
  Operations: ['team:operations', 'm-mfg'],
  Commercial: ['team:commercial', 'm-demo'],
  Finance: ['d-budget'],
  Hiring: ['m-hire'],
}

function targetFromRoute(to: string | undefined): string | undefined {
  if (!to) return undefined
  const m = to.match(/^\/missions\/(m-[a-z]+)/)
  if (m) return m[1]
  const t = to.match(/^\/teams#([a-z]+)/)
  if (t) return `team:${t[1]}`
  const p = to.match(/^\/projects\/(p-[a-z]+)/)
  if (p) return p[1]
  return undefined
}

export function buildGraph(): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  const seen = new Set<string>()
  const add = (n: GraphNode) => {
    if (seen.has(n.id)) return
    seen.add(n.id)
    nodes.push(n)
  }
  const link = (a: string, b: string, kind: string) => links.push({ source: a, target: b, kind })
  const teamId = (name: string) => `team:${teams.find((t) => t.name === name)?.id ?? name.toLowerCase()}`

  // teams + people
  for (const t of teams) {
    add({
      id: `team:${t.id}`,
      type: 'team',
      label: t.name,
      sub: `${t.headcount} people · ${t.resourcing.utilization}% utilised`,
      desc: t.specialty,
      to: `/teams#${t.id}`,
      size: typeMeta.team.size,
      color: typeMeta.team.color,
      meta: [
        { k: 'Lead', v: t.lead },
        { k: 'Status', v: statusWord(t.status) },
        { k: 'Committed', v: `${t.resourcing.allocated} / ${t.resourcing.capacity}` },
        { k: 'Open roles', v: String(t.resourcing.openRoles) },
      ],
    })
    for (const m of t.members) {
      add({
        id: personId(m.name),
        type: 'person',
        label: m.name,
        sub: `${m.title} · ${t.name}`,
        desc: m.focus,
        to: `/teams#${t.id}`,
        size: m.title === 'Team Lead' ? 5 : typeMeta.person.size,
        color: m.status === 'on-track' ? typeMeta.person.color : m.status === 'at-risk' ? '#d9a54b' : '#e07070',
        meta: [
          { k: 'Role', v: m.title },
          { k: 'Status', v: statusWord(m.status) },
        ],
        group: undefined,
      })
      link(`team:${t.id}`, personId(m.name), 'member')
    }
  }

  // projects
  for (const p of projects) {
    const f = forecastProject(p)
    add({
      id: p.id,
      type: 'project',
      label: p.name,
      sub: `${p.code} · ${p.kind === 'product' ? 'Product' : 'In testing'} · ${p.stage}`,
      desc: p.summary,
      to: `/projects/${p.id}`,
      size: p.kind === 'product' ? 14 : 12,
      color: typeMeta.project.color,
      meta: [
        { k: 'Status', v: statusWord(p.status) },
        { k: 'Progress', v: `${p.progress}%` },
        { k: 'Gate', v: p.gate },
        { k: 'Forecast', v: f.slipDays ? `+${f.slipDays} days` : 'holds' },
        { k: 'Risk score', v: `${f.riskScore} / 100` },
      ],
      group: p.id,
    })
    link(p.id, teamId(p.team), 'owns')
    if (seen.has(personId(p.lead))) link(p.id, personId(p.lead), 'leads')
    else {
      add({ id: personId(p.lead), type: 'person', label: p.lead, sub: `Project lead · ${p.team}`, desc: `Leads ${p.name}.`, size: 5, color: typeMeta.person.color, to: `/projects/${p.id}`, group: p.id })
      link(p.id, personId(p.lead), 'leads')
      link(teamId(p.team), personId(p.lead), 'member')
    }
  }

  // missions
  for (const m of missions) {
    const p = projectFor(m.id)
    add({
      id: m.id,
      type: 'mission',
      label: m.name,
      sub: `${m.team} · ${statusWord(m.status)} · due ${m.due}`,
      desc: m.summary,
      to: `/missions/${m.id}`,
      size: typeMeta.mission.size,
      color: m.status === 'on-track' ? typeMeta.mission.color : m.status === 'at-risk' ? '#d9a54b' : '#e07070',
      meta: [
        { k: 'Owner', v: m.owner },
        { k: 'Progress', v: `${m.progress}%` },
        { k: 'Due', v: m.due },
        ...(p ? [{ k: 'Project', v: p.code }] : []),
      ],
      group: p?.id,
    })
    if (p) link(m.id, p.id, 'rolls-up')
    link(m.id, teamId(m.team), 'team')
    if (seen.has(personId(m.owner))) link(m.id, personId(m.owner), 'owner')
  }

  // decisions
  for (const d of decisions) {
    add({
      id: d.id,
      type: 'decision',
      label: d.title,
      sub: `${d.priority === 'high' ? 'High priority' : 'Open'} · recommendation: ${d.recommendation}`,
      desc: d.summary,
      to: '/decisions',
      size: d.priority === 'high' ? 8.5 : typeMeta.decision.size,
      color: typeMeta.decision.color,
      meta: d.options.map((o) => ({ k: o.recommended ? 'Recommended' : 'Option', v: o.label })),
      group: decisionLinks[d.id]?.find((x) => x.startsWith('p-')),
    })
    for (const t of decisionLinks[d.id] ?? []) if (seen.has(t) || t.startsWith('station:')) link(d.id, t, 'protects')
  }

  // gates
  for (const g of gates) {
    add({ id: g.id, type: 'gate', label: g.label, sub: `Gate · ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][g.month - 1]} ${g.day}`, desc: 'A dated milestone the portfolio is counting down to.', to: '/control-room', size: typeMeta.gate.size, color: typeMeta.gate.color, group: gateLinks[g.id]?.find((x) => x.startsWith('p-')) })
    for (const t of gateLinks[g.id] ?? []) if (seen.has(t)) link(g.id, t, 'gates')
  }

  // readiness stations
  for (const r of flightReadiness) {
    add({
      id: `station:${r.domain}`,
      type: 'station',
      label: `${r.domain} station`,
      sub: `Readiness · ${r.status.toUpperCase()}`,
      desc: r.note,
      to: '/control-room',
      size: typeMeta.station.size,
      color: r.status === 'go' ? typeMeta.station.color : r.status === 'watch' ? '#d9a54b' : '#e07070',
    })
    for (const t of stationLinks[r.domain] ?? []) if (seen.has(t)) link(`station:${r.domain}`, t, 'polls')
  }
  // decisions → stations (added after stations exist)
  for (const d of decisions) for (const t of decisionLinks[d.id] ?? []) if (t.startsWith('station:') && seen.has(t)) link(d.id, t, 'protects')

  // knowledge docs
  for (const k of knowledge) {
    add({ id: k.id, type: 'doc', label: k.title, sub: `${k.category} · updated ${k.updated}`, desc: k.summary, to: '/knowledge', size: typeMeta.doc.size, color: typeMeta.doc.color, group: docLinks[k.id]?.find((x) => x.startsWith('p-')) })
    for (const t of docLinks[k.id] ?? []) if (seen.has(t)) link(k.id, t, 'documents')
  }

  // anomalies (computed)
  for (const a of detectAnomalies()) {
    const t = targetFromRoute(a.to) ?? (a.kind === 'Decision' || a.kind === 'Readiness' ? 'd-supplier' : 'p-proto')
    add({ id: a.id, type: 'anomaly', label: a.title, sub: `${a.kind} · ${a.severity}`, desc: a.detail, to: a.to, size: a.severity === 'high' ? 7 : typeMeta.anomaly.size, color: a.severity === 'high' ? '#e07070' : '#d9a54b', group: t.startsWith('p-') ? t : projectFor(t)?.id })
    if (seen.has(t)) link(a.id, t, 'flags')
  }

  // AI recommended actions
  for (const rec of recommendations) {
    const t = targetFromRoute(rec.to) ?? (rec.id === 'r-supplier' ? 'd-supplier' : rec.id === 'r-allocation' ? 'd-allocation' : rec.id === 'r-briefing' ? 'm-demo' : 'team:commercial')
    add({ id: rec.id, type: 'action', label: rec.title, sub: `AI action · ${rec.impact} impact · ${rec.category}`, desc: rec.rationale, to: '/', size: typeMeta.action.size, color: typeMeta.action.color, group: projectFor(t)?.id })
    if (seen.has(t)) link(rec.id, t, 'recommends')
  }

  // signals — ingested against missions and projects
  const r = rng(20260918)
  const missionById = new Map(missions.map((m) => [m.id, m]))
  const projectsById = new Map(projects.map((p) => [p.id, p]))
  const who = teams.flatMap((t) => t.members.map((m) => m.name.split(' ')[0]))
  const emitSignals = (targetId: string, count: number, pid: string, ownerTeam: string) => {
    for (let i = 0; i < count; i++) {
      const tpl = pick(r, signalTemplates)
      const label = fill(r, pick(r, tpl.t), pid, who)
      const id = `sig:${targetId}:${i}`
      const target = missionById.get(targetId) ?? projectsById.get(targetId)
      add({
        id,
        type: 'signal',
        label,
        sub: `${tpl.src} · ${pick(r, times)}`,
        desc: `Ingested from ${tpl.src} and linked to ${target ? (target as Mission | Project).name : targetId} (${ownerTeam}).`,
        to: missionById.has(targetId) ? `/missions/${targetId}` : `/projects/${targetId}`,
        size: typeMeta.signal.size + (r() < 0.12 ? 1.2 : 0),
        color: sourceColor[tpl.src] ?? typeMeta.signal.color,
        group: pid,
      })
      link(id, targetId, 'signal')
    }
  }
  for (const m of missions) {
    const p = projectFor(m.id)
    emitSignals(m.id, 30 + Math.floor(r() * 16), p?.id ?? 'p-proto', m.team)
  }
  for (const p of projects) emitSignals(p.id, 20 + Math.floor(r() * 10), p.id, p.team)

  // ambient ring — watched, not yet linked
  let i = 0
  for (const [cat, tpls] of Object.entries(ambientTemplates)) {
    for (let j = 0; j < 28; j++) {
      const label = fill(r, pick(r, tpls), 'p-proto', who)
      add({ id: `amb:${i++}`, type: 'ambient', label, sub: `${cat} · watching`, desc: `Ambient ${cat.toLowerCase()} signal the AI is tracking. Not yet linked to a mission — it becomes a signal the moment a mission cites it.`, size: typeMeta.ambient.size + (r() < 0.2 ? 0.8 : 0), color: ambientColor[cat] ?? typeMeta.ambient.color, ring: true })
    }
  }

  return { nodes, links }
}

/** The sub-graph within `depth` hops of a node (ambient ring excluded). */
export function egoGraph(rootId: string, depth = 2): { nodes: GraphNode[]; links: GraphLink[] } {
  const { nodes, links } = buildGraph()
  const adj = new Map<string, Set<string>>()
  for (const l of links) {
    if (!adj.has(l.source)) adj.set(l.source, new Set())
    if (!adj.has(l.target)) adj.set(l.target, new Set())
    adj.get(l.source)!.add(l.target)
    adj.get(l.target)!.add(l.source)
  }
  const keep = new Set<string>([rootId])
  let frontier = [rootId]
  for (let d = 0; d < depth; d++) {
    const next: string[] = []
    for (const id of frontier)
      for (const n of adj.get(id) ?? [])
        if (!keep.has(n)) {
          keep.add(n)
          next.push(n)
        }
    frontier = next
  }
  const ns = nodes.filter((n) => keep.has(n.id) && !n.ring)
  const ids = new Set(ns.map((n) => n.id))
  return { nodes: ns, links: links.filter((l) => ids.has(l.source) && ids.has(l.target)) }
}
