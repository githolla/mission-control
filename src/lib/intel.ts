// Portfolio intelligence — every number here is computed from src/data.ts so the
// demo stays coherent: schedule forecasts, risk scoring, anomaly detection,
// resource forecasting, a what-if simulator and a briefing generator.
// No backend, no API: it is a deterministic model over the local dataset.

import { projects, missions, teams, decisions, flightReadiness, missionsForProject, type Project, type Mission, type Team } from '../data'

/* ── time helpers ─────────────────────────────────────────────────────── */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY = 86_400_000
const YEAR = new Date().getFullYear()

export const gateDate = (p: Project) => new Date(YEAR, p.gateMonth - 1, p.gateDay)
export const fmt = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY)
export const daysUntil = (d: Date, now = new Date()) => Math.ceil((d.getTime() - now.getTime()) / DAY)

export function parseDue(due: string): Date | null {
  const m = due.trim().match(/^([A-Za-z]{3})\s+(\d{1,2})$/)
  if (!m) return null
  const mi = MONTHS.indexOf(m[1])
  return mi < 0 ? null : new Date(YEAR, mi, parseInt(m[2], 10))
}

/** Engineers committed per project (the Engineering team owns four of the six). */
export const engineersOn: Record<string, number> = { 'p-proto': 19, 'p-sensor': 8, 'p-neutron': 6, 'p-materials': 5 }

/* ── schedule forecast ────────────────────────────────────────────────── */
const PHASE_DAYS = 120 // planning assumption: the current phase of each project is a ~120-day run to its gate

export type Confidence = 'high' | 'medium' | 'low'
export type Forecast = {
  project: Project
  gate: Date
  daysToGate: number
  expected: number // % progress the plan calls for today
  spi: number // schedule performance index: actual / expected
  slipDays: number // predicted slip against the gate if nothing changes (0 = holds)
  predictedGate: Date
  confidence: Confidence
  riskScore: number // 0..100
  drivers: string[]
  trend: 'ahead' | 'on plan' | 'behind'
}

export function forecastProject(p: Project, now = new Date()): Forecast {
  const gate = gateDate(p)
  const d = daysUntil(gate, now)
  const expected = Math.round(Math.max(0, Math.min(100, (1 - d / PHASE_DAYS) * 100)))
  const spi = expected > 0 ? p.progress / expected : 1.2
  const gap = expected - p.progress
  let slip = gap > 4 ? Math.round(gap * 0.3) : 0
  if (p.status === 'at-risk') slip += 2
  if (p.status === 'blocked') slip += 6

  const team = teams.find((t) => t.name === p.team)
  const ms = missionsForProject(p)
  const atRisk = ms.filter((m) => m.status !== 'on-track')
  const drivers: string[] = []
  let risk = p.status === 'on-track' ? 18 : p.status === 'at-risk' ? 55 : 78
  if (gap > 4) {
    risk += Math.min(18, gap)
    drivers.push(`${gap} pts behind the plan line (${p.progress}% vs ${expected}% expected)`)
  }
  if (atRisk.length) {
    risk += atRisk.length * 8
    drivers.push(`${atRisk.length} of ${ms.length} missions at risk: ${atRisk.map((m) => m.name).join(', ')}`)
  }
  if (team && team.resourcing.utilization >= 90) {
    risk += 8
    drivers.push(`${team.name} is at ${team.resourcing.utilization}% utilisation — no slack to absorb a surprise`)
  }
  if (d >= 0 && d <= 21) {
    risk += 6
    drivers.push(`Gate is inside the 3-week window (T-${d})`)
  }
  const shared = projects.filter((q) => q.id !== p.id && q.team === p.team && Math.abs(daysUntil(gateDate(q), now) - d) <= 10)
  if (shared.length) {
    risk += 6
    drivers.push(`Gate collides with ${shared.map((q) => q.code).join(', ')} on the same team within 10 days`)
  }
  if (!drivers.length) drivers.push('No active risk drivers — progress is ahead of the plan line')
  risk = Math.max(5, Math.min(92, Math.round(risk * 0.88)))

  const confidence: Confidence = p.status === 'on-track' && spi >= 0.95 ? 'high' : spi >= 0.8 ? 'medium' : 'low'
  const trend = spi >= 1.08 ? 'ahead' : spi >= 0.94 ? 'on plan' : 'behind'
  return { project: p, gate, daysToGate: d, expected, spi, slipDays: slip, predictedGate: addDays(gate, slip), confidence, riskScore: risk, drivers, trend }
}

export const forecasts = (now = new Date()) => projects.map((p) => forecastProject(p, now))

/* ── risk heatmap ─────────────────────────────────────────────────────── */
export const riskCategories = ['Schedule', 'Resourcing', 'Technical', 'Supply', 'Commercial'] as const
export type RiskCategory = (typeof riskCategories)[number]

// Narrative overlay for the categories the numbers cannot see (technical, supply, commercial).
const overlay: Record<string, Partial<Record<RiskCategory, number>>> = {
  'p-proto': { Technical: 2, Supply: 3, Commercial: 1 },
  'p-cryo': { Technical: 0, Supply: 1, Commercial: 2 },
  'p-photon': { Technical: 1, Supply: 1, Commercial: 1 },
  'p-sensor': { Technical: 0, Supply: 0, Commercial: 0 },
  'p-neutron': { Technical: 2, Supply: 1, Commercial: 2 },
  'p-materials': { Technical: 2, Supply: 0, Commercial: 1 },
}

/** 0 (clear) .. 3 (severe) per project × category. */
export function riskMatrix(now = new Date()) {
  return projects.map((p) => {
    const f = forecastProject(p, now)
    const team = teams.find((t) => t.name === p.team)
    const schedule = f.slipDays >= 6 ? 3 : f.slipDays > 0 ? 2 : f.trend === 'behind' ? 1 : 0
    const util = team?.resourcing.utilization ?? 0
    const resourcing = util >= 94 ? 3 : util >= 88 ? 2 : util >= 80 ? 1 : 0
    const o = overlay[p.id] ?? {}
    const cells: Record<RiskCategory, number> = {
      Schedule: schedule,
      Resourcing: resourcing,
      Technical: o.Technical ?? 1,
      Supply: o.Supply ?? 0,
      Commercial: o.Commercial ?? 0,
    }
    return { project: p, cells, total: Object.values(cells).reduce((a, b) => a + b, 0) }
  })
}

/* ── anomaly detection ────────────────────────────────────────────────── */
export type Anomaly = {
  id: string
  severity: 'high' | 'medium' | 'low'
  kind: 'Schedule' | 'Resourcing' | 'Dependency' | 'Decision' | 'Readiness'
  title: string
  detail: string
  to: string
}

export function detectAnomalies(now = new Date()): Anomaly[] {
  const out: Anomaly[] = []
  // missions behind their own plan line
  for (const m of missions) {
    const due = parseDue(m.due)
    if (!due) continue
    const d = daysUntil(due, now)
    const expected = Math.round(Math.max(0, Math.min(100, (1 - d / PHASE_DAYS) * 100)))
    const gap = expected - m.progress
    if (gap >= 10) {
      out.push({
        id: `an-${m.id}`,
        severity: gap >= 18 ? 'high' : 'medium',
        kind: 'Schedule',
        title: `${m.name} is ${gap} pts behind plan`,
        detail: `${m.progress}% complete vs ${expected}% expected with ${d} days to ${m.due}. Owner ${m.owner}.`,
        to: `/missions/${m.id}`,
      })
    }
  }
  // over-committed teams
  for (const t of teams) {
    if (t.resourcing.utilization >= 90)
      out.push({
        id: `an-util-${t.id}`,
        severity: t.resourcing.utilization >= 94 ? 'high' : 'medium',
        kind: 'Resourcing',
        title: `${t.name} is over-committed at ${t.resourcing.utilization}%`,
        detail: `${t.resourcing.allocated} of ${t.resourcing.capacity} committed with ${t.resourcing.openRoles} open roles. Any slip has nowhere to go.`,
        to: `/teams#${t.id}`,
      })
  }
  // gate collisions on a shared team
  for (let i = 0; i < projects.length; i++)
    for (let j = i + 1; j < projects.length; j++) {
      const a = projects[i], b = projects[j]
      if (a.team !== b.team) continue
      const gap = Math.abs(daysUntil(gateDate(a), now) - daysUntil(gateDate(b), now))
      if (gap <= 10)
        out.push({
          id: `an-col-${a.id}-${b.id}`,
          severity: 'medium',
          kind: 'Dependency',
          title: `${a.code} and ${b.code} gates land ${gap} days apart on ${a.team}`,
          detail: `${a.gate} and ${b.gate} draw on the same people. Sequence or split the support window now.`,
          to: '/decisions',
        })
    }
  // cross-team dependency from the narrative (demo + prototype share engineering)
  out.push({
    id: 'an-dep-demo',
    severity: 'medium',
    kind: 'Dependency',
    title: 'Partner demo and prototype testing need the same engineers',
    detail: 'Oct 6 demo support overlaps the Oct 10 review test window. The allocation decision resolves it.',
    to: '/decisions',
  })
  // open no-go
  for (const r of flightReadiness)
    if (r.status === 'no-go')
      out.push({ id: `an-nogo-${r.domain}`, severity: 'high', kind: 'Readiness', title: `${r.domain} is NO-GO`, detail: r.note, to: '/decisions' })
  // decisions with gates inside two weeks
  for (const d of decisions)
    if (d.priority === 'high')
      out.push({ id: `an-dec-${d.id}`, severity: 'high', kind: 'Decision', title: `Decision pending: ${d.title}`, detail: d.summary, to: '/decisions' })

  const order = { high: 0, medium: 1, low: 2 }
  return out.sort((a, b) => order[a.severity] - order[b.severity])
}

/* ── resource forecast ────────────────────────────────────────────────── */
export type WeekLoad = { week: number; label: string; demand: number; gates: string[] }

/** Demand (% of capacity) per week for the next 8 weeks: baseline utilisation plus a surge around each gate. */
export function resourceForecast(team: Team, now = new Date()): WeekLoad[] {
  const owned = projects.filter((p) => p.team === team.name)
  const weeks: WeekLoad[] = []
  for (let w = 0; w < 8; w++) {
    const start = addDays(now, w * 7)
    let demand = team.resourcing.utilization - 4
    const gates: string[] = []
    for (const p of owned) {
      const dg = daysUntil(gateDate(p), start) / 7 // weeks from this week to the gate
      const surge = 14 * Math.exp(-(dg * dg) / 2.2)
      demand += surge
      if (dg >= 0 && dg < 1) gates.push(p.code)
    }
    // shared engineering support for the partner demo (cross-team dependency)
    if (team.id === 'engineering') {
      const dd = daysUntil(new Date(YEAR, 9, 6), start) / 7
      demand += 6 * Math.exp(-(dd * dd) / 1.5)
    }
    weeks.push({ week: w + 1, label: fmt(start), demand: Math.round(demand), gates })
  }
  return weeks
}

/* ── what-if simulator ────────────────────────────────────────────────── */
export type Scenario = { from: string; to: string; n: number }
export type ScenarioResult = {
  from: { project: Project; before: Forecast; slipAfter: number; gateAfter: Date }
  to: { project: Project; before: Forecast; slipAfter: number; gateAfter: Date; bufferDays: number }
  net: number // portfolio slip-days recovered (positive = good)
  note: string
}

export function simulate(s: Scenario, now = new Date()): ScenarioResult | null {
  const from = projects.find((p) => p.id === s.from)
  const to = projects.find((p) => p.id === s.to)
  if (!from || !to || from.id === to.id) return null
  const bf = forecastProject(from, now)
  const bt = forecastProject(to, now)
  const ef = engineersOn[from.id] ?? 6
  const et = engineersOn[to.id] ?? 6
  const n = Math.min(s.n, Math.max(0, ef - 2))
  // receiving project: remaining work spreads over more people (with ramp-up loss)
  const gainRatio = 1 - et / (et + n * 0.85)
  const recovered = Math.round((bt.slipDays + Math.max(0, 100 - to.progress) * 0.6) * gainRatio)
  const slipTo = Math.max(0, bt.slipDays - recovered)
  const buffer = Math.max(0, recovered - bt.slipDays)
  // donating project: loses velocity in proportion to the people it gives up, but slack ahead of its plan line absorbs the hit first
  const lossRatio = n / ef
  const rawLoss = Math.round(Math.max(0, 100 - from.progress) * 0.35 * lossRatio + (bf.slipDays > 0 ? lossRatio * 6 : 0))
  const slack = Math.max(0, Math.round((from.progress - bf.expected) * 0.3))
  const added = Math.max(0, rawLoss - slack)
  const slipFrom = bf.slipDays + added
  const net = bt.slipDays - slipTo - (slipFrom - bf.slipDays)
  const note =
    n === 0
      ? 'Move at least one engineer to see the effect.'
      : net > 0
        ? `Recovers ${net} portfolio slip-days. ${to.code} ${slipTo === 0 ? 'holds its gate' : `lands at +${slipTo}d`}; ${from.code} ${added === 0 ? `absorbs the loss inside its ${slack}-day slack` : `slips +${added}d after using ${slack} days of slack`}.`
        : `Net negative: ${from.code} loses more than ${to.code} gains. Try fewer people or a different source.`
  return {
    from: { project: from, before: bf, slipAfter: slipFrom, gateAfter: addDays(bf.gate, slipFrom) },
    to: { project: to, before: bt, slipAfter: slipTo, gateAfter: addDays(bt.gate, slipTo), bufferDays: buffer },
    net,
    note,
  }
}

/* ── briefing generator ───────────────────────────────────────────────── */
export type Audience = 'board' | 'leads' | 'self'

export function generateBrief(audience: Audience, now = new Date()): { title: string; paragraphs: string[] } {
  const fs = forecasts(now).sort((a, b) => a.daysToGate - b.daysToGate)
  const upcoming = fs.filter((f) => f.daysToGate >= 0)
  const next = upcoming[0]
  const onTrack = projects.filter((p) => p.status === 'on-track').length
  const slipping = fs.filter((f) => f.slipDays > 0)
  const ahead = fs.filter((f) => f.trend === 'ahead')
  const noGo = flightReadiness.filter((r) => r.status === 'no-go')
  const util = teams.map((t) => `${t.name} ${t.resourcing.utilization}%`).join(', ')
  const hi = decisions.filter((d) => d.priority === 'high')

  if (audience === 'board')
    return {
      title: 'Board update — portfolio status',
      paragraphs: [
        `${onTrack} of ${projects.length} base projects are on track. ${ahead.length} are ahead of their plan line (${ahead.map((f) => f.project.code).join(', ')}). The next gate is ${next?.project.gate ?? '—'} (${next?.project.name ?? ''}), T-${next?.daysToGate ?? '—'}.`,
        slipping.length
          ? `Forecast exposure is concentrated in ${slipping.map((f) => `${f.project.name} (+${f.slipDays} days if unmitigated)`).join(' and ')}. Mitigations are identified and awaiting the director's call; expected residual slip after mitigation is under one week.`
          : 'No project is forecast to slip its gate.',
        `Readiness: ${flightReadiness.length - noGo.length} of ${flightReadiness.length} stations GO. ${hi.length ? `One high-priority decision is open (${hi.map((d) => d.title.toLowerCase()).join(', ')}).` : ''} Compact Neutron Source published a world-record result with INRS; productization path is being defined ahead of the scale-up review.`,
      ],
    }
  if (audience === 'leads')
    return {
      title: 'Team leads — what I need this week',
      paragraphs: [
        `Priority one is ${next?.project.name ?? 'the next gate'} at T-${next?.daysToGate ?? '—'}. ${slipping.length ? `${slipping.map((f) => f.project.code).join(' and ')} ${slipping.length > 1 ? 'are' : 'is'} behind the plan line — I want a recovery plan with owners and dates by Wednesday.` : 'Everything is on its plan line.'}`,
        `Utilisation is ${util}. Engineering has no slack: any new ask goes through me before it lands on the team. The October allocation between prototype testing and the partner demo is being sequenced — prototype first, demo support from Oct 7.`,
        `Decisions on my console: ${decisions.map((d) => d.title.toLowerCase()).join('; ')}. I'll close the supplier call today. Flag anything that changes a gate date within the hour, not at the weekly.`,
      ],
    }
  return {
    title: 'Director — my read of the board',
    paragraphs: [
      `Watch list: ${fs
        .filter((f) => f.riskScore >= 40)
        .map((f) => `${f.project.code} (risk ${f.riskScore})`)
        .join(', ') || 'clear'}. ${slipping.length ? `Unmitigated, ${slipping.map((f) => `${f.project.code} lands ${fmt(f.predictedGate)}`).join(' and ')}.` : ''}`,
      `Two calls unlock the most: approve the alternate supplier (protects Oct 10, ~3% batch cost) and sequence engineering (protects certification, demo still supported). Both are ready — no further data will change the answer.`,
      `Questions I still want answered: can CRX and PV2 both hold if the demo needs a second rehearsal? Is QMP's December go/no-go real or a formality? Who owns CNS productization after the Nature paper?`,
    ],
  }
}

/* ── questions the AI thinks Steve should ask ─────────────────────────── */
export function questionsToAsk(now = new Date()): { q: string; why: string; to: string }[] {
  const fs = forecasts(now)
  const out: { q: string; why: string; to: string }[] = []
  for (const f of fs) {
    if (f.slipDays > 0)
      out.push({
        q: `What is the earliest ${f.project.code} can hold its gate if we act this week?`,
        why: `Forecast +${f.slipDays}d unmitigated; mitigation exists but is unapproved.`,
        to: `/projects/${f.project.id}`,
      })
    if (f.trend === 'ahead' && f.project.kind === 'product')
      out.push({
        q: `${f.project.code} is ahead of plan — can we pull the ${f.project.gate.split('·')[0].trim().toLowerCase()} forward?`,
        why: `${f.project.progress}% vs ${f.expected}% expected. Slack is a resource; use it or lend it.`,
        to: `/projects/${f.project.id}`,
      })
  }
  out.push({ q: 'Who owns the CNS productization path after the Nature Communications result?', why: 'World-record flux with no mission attached yet. Explorations drift without an owner.', to: '/projects/p-neutron' })
  out.push({ q: 'If the partner demo needs a second rehearsal, which engineers does it take from PV2?', why: 'The two share a team inside a 4-day window.', to: '/decisions' })
  out.push({ q: 'Is the QMP December go/no-go on evidence or on the calendar?', why: '3 of 5 benchmarks passed; the last two decide the product.', to: '/projects/p-materials' })
  return out.slice(0, 6)
}

/* ── lookups used by the answer engine ────────────────────────────────── */
export function findProject(text: string): Project | undefined {
  const t = text.toLowerCase()
  return projects.find((p) => t.includes(p.code.toLowerCase()) || t.includes(p.name.toLowerCase()) || p.name.toLowerCase().split(' ').filter((w) => w.length > 4).some((w) => t.includes(w)))
}
export function findMission(text: string): Mission | undefined {
  const t = text.toLowerCase()
  return missions.find((m) => t.includes(m.name.toLowerCase()))
}
export function findTeam(text: string): Team | undefined {
  const t = text.toLowerCase()
  return teams.find((tm) => t.includes(tm.name.toLowerCase()))
}
export function dueWithin(days: number, now = new Date()) {
  return missions
    .map((m) => ({ m, d: parseDue(m.due) }))
    .filter((x): x is { m: Mission; d: Date } => Boolean(x.d))
    .map((x) => ({ ...x, t: daysUntil(x.d, now) }))
    .filter((x) => x.t >= 0 && x.t <= days)
    .sort((a, b) => a.t - b.t)
}
