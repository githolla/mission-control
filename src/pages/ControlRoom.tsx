import { Link } from 'react-router-dom'
import {
  projects,
  missions,
  missionsForProject,
  decisions,
  activity,
  type Project,
  type Status,
} from '../data'
import { Card, StatusPill, SectionHeading, ActivityIcon } from '../components/ui'
import { ReadinessBoard } from '../components/mission'
import { ArrowRightIcon, AlertIcon, BranchIcon, CalendarIcon } from '../components/icons'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEAR = new Date().getFullYear()
const START = new Date(YEAR, 8, 15) // Sep 15
const END = new Date(YEAR, 11, 31) // Dec 31
const SPAN = END.getTime() - START.getTime()
const NOW = new Date()

const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - START.getTime()) / SPAN) * 100))
const hue = (s: Status) =>
  s === 'on-track' ? 'var(--color-ok)' : s === 'at-risk' ? 'var(--color-warn)' : 'var(--color-bad)'

function parseDue(due: string): Date | null {
  const m = due.trim().match(/^([A-Za-z]{3})\s+(\d{1,2})$/)
  if (!m) return null
  const mi = MONTHS.indexOf(m[1])
  if (mi < 0) return null
  return new Date(YEAR, mi, parseInt(m[2], 10))
}

const tMinus = (d: Date) => Math.round((d.getTime() - NOW.getTime()) / 86_400_000)

// Month gridlines (Oct / Nov / Dec starts) shown on every track.
const monthTicks = [9, 10, 11].map((m) => ({ label: MONTHS[m], left: pct(new Date(YEAR, m, 1)) }))
const nowLeft = pct(NOW)

function Track({ project }: { project: Project }) {
  const gateDate = new Date(YEAR, project.gateMonth - 1, project.gateDay)
  const gateLeft = pct(gateDate)
  const gateT = tMinus(gateDate)
  const missionMarks = missionsForProject(project)
    .map((m) => ({ m, date: parseDue(m.due) }))
    .filter((x): x is { m: (typeof missions)[number]; date: Date } => Boolean(x.date))

  return (
    <div className="relative h-11">
      {/* month gridlines */}
      {monthTicks.map((t) => (
        <div key={t.label} className="absolute inset-y-0 w-px bg-line" style={{ left: `${t.left}%` }} />
      ))}
      {/* now line */}
      <div className="absolute inset-y-0 w-px" style={{ left: `${nowLeft}%`, background: 'var(--color-accent)' }} />
      {/* baseline */}
      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-line" />
      {/* progress along baseline up to the gate */}
      <div
        className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full"
        style={{ left: `${nowLeft}%`, width: `${Math.max(0, gateLeft - nowLeft)}%`, background: hue(project.status) }}
      />
      {/* mission ticks */}
      {missionMarks.map(({ m, date }) => (
        <div
          key={m.id}
          className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
          style={{ left: `${pct(date)}%`, background: hue(m.status) }}
          title={`${m.name} · ${m.due}`}
        />
      ))}
      {/* gate marker */}
      <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${gateLeft}%` }}>
        <div
          className="h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px]"
          style={{ background: hue(project.status) }}
          title={`${project.gate}`}
        />
        <span
          className={`absolute top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] font-medium ${gateT < 0 ? 'text-slate-400' : 'text-ink-700'}`}
          style={{ left: '0.4rem' }}
        >
          {gateT >= 0 ? `T-${gateT}` : 'done'}
        </span>
      </div>
    </div>
  )
}

export default function ControlRoom() {
  const onTrack = projects.filter((p) => p.status === 'on-track').length
  const atRisk = projects.filter((p) => p.status !== 'on-track')
  const gatesSoon = projects.filter((p) => {
    const t = tMinus(new Date(YEAR, p.gateMonth - 1, p.gateDay))
    return t >= 0 && t <= 30
  }).length
  const anomalies = missions.filter((m) => m.status !== 'on-track')

  const summary = [
    { label: 'Projects', value: `${projects.length}` },
    { label: 'On track', value: `${onTrack}`, hue: 'var(--color-ok)' },
    { label: 'Needs attention', value: `${atRisk.length}`, hue: 'var(--color-warn)' },
    { label: 'Gates ≤ 30d', value: `${gatesSoon}` },
    { label: 'Open decisions', value: `${decisions.length}` },
    { label: 'Open anomalies', value: `${anomalies.length}`, hue: 'var(--color-warn)' },
  ]

  return (
    <div className="space-y-7">
      <SectionHeading
        eyebrow="Control Room"
        title="Portfolio control room"
        subtitle="Every project, gate, risk and decision on one console — the whole company at a glance."
      />

      {/* Summary readout */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 xl:grid-cols-6">
        {summary.map((s) => (
          <div key={s.label} className="bg-white px-4 py-3.5">
            <div className="eyebrow">{s.label}</div>
            <div className="mt-1.5 flex items-center gap-2">
              {s.hue && <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.hue }} />}
              <span className="font-mono text-xl font-medium text-ink-900">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio timeline — the big board */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <div className="eyebrow">Portfolio timeline</div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Gates and mission milestones through year-end.</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium text-[var(--color-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-ink-700" /> Gate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-ink-700 ring-2 ring-white" /> Mission
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-px" style={{ background: 'var(--color-accent)' }} /> Now
            </span>
          </div>
        </div>

        <div className="overflow-x-auto px-5 py-4">
          <div className="min-w-[720px]">
            {/* Month axis */}
            <div className="mb-2 flex">
              <div className="w-[220px] shrink-0" />
              <div className="relative h-4 flex-1">
                {monthTicks.map((t) => (
                  <span
                    key={t.label}
                    className="absolute -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                    style={{ left: `${t.left}%` }}
                  >
                    {t.label}
                  </span>
                ))}
                <span
                  className="absolute -translate-x-1/2 font-mono text-[10px] font-semibold"
                  style={{ left: `${nowLeft}%`, color: 'var(--color-accent)' }}
                >
                  NOW
                </span>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-line">
              {projects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="group flex items-center hover:bg-[#f7f8fa]">
                  <div className="flex w-[220px] shrink-0 items-center gap-2.5 py-2 pr-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line font-mono text-[10px] font-semibold text-ink-800">
                      {p.code}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink-900">{p.name}</span>
                      <span className="block truncate text-[10px] uppercase tracking-[0.1em] text-slate-400">
                        {p.kind === 'product' ? 'Product' : 'In testing'}
                      </span>
                    </span>
                  </div>
                  <div className="flex-1">
                    <Track project={p} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Status matrix */}
      <Card className="overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <div className="eyebrow">All projects</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {['Project', 'Stage', 'Status', 'Progress', 'Next gate', 'Lead', 'Missions'].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {projects.map((p) => {
                const gateDate = new Date(YEAR, p.gateMonth - 1, p.gateDay)
                const t = tMinus(gateDate)
                return (
                  <tr key={p.id} className="group hover:bg-[#f7f8fa]">
                    <td className="px-5 py-3">
                      <Link to={`/projects/${p.id}`} className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line font-mono text-[10px] font-semibold text-ink-800">
                          {p.code}
                        </span>
                        <span className="font-medium text-ink-900">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-muted)]">{p.stage}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-line">
                          <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: hue(p.status) }} />
                        </div>
                        <span className="font-mono text-xs text-[var(--color-muted)]">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-ink-800">{t >= 0 ? `T-${t}` : '—'}</span>
                      <span className="ml-2 text-xs text-[var(--color-muted)]">{p.gate}</span>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-muted)]">{p.lead}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--color-muted)]">{p.missionIds.length}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Readiness + attention */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ReadinessBoard />

        <Card className="overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <div className="eyebrow">Needs your call</div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Open decisions and anomalies across the portfolio.</p>
          </div>
          <ul className="divide-y divide-line">
            {decisions.map((d) => {
              const Icon = d.icon === 'branch' ? BranchIcon : CalendarIcon
              return (
                <li key={d.id}>
                  <Link to="/decisions" className="flex items-center gap-3 px-5 py-3 hover:bg-[#f7f8fa]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-ink-700">
                      <Icon width={16} height={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">{d.title}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      Decision
                    </span>
                    <ArrowRightIcon width={15} height={15} className="text-slate-400" />
                  </Link>
                </li>
              )
            })}
            {anomalies.map((m) => (
              <li key={m.id}>
                <Link to={`/missions/${m.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#f7f8fa]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-warn)]/30 text-[var(--color-warn)]">
                    <AlertIcon width={16} height={16} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">{m.name}</span>
                  <StatusPill status={m.status} />
                  <ArrowRightIcon width={15} height={15} className="text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Live activity */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="eyebrow">Live activity</div>
          <Link to="/ai-activity" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-900 hover:text-black">
            View all
            <ArrowRightIcon width={15} height={15} />
          </Link>
        </div>
        <ul className="divide-y divide-line">
          {activity.slice(0, 5).map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-slate-500">
                <ActivityIcon name={a.icon} width={15} height={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink-900">{a.title}</span>
                <span className="block truncate text-xs text-[var(--color-muted)]">{a.detail}</span>
              </span>
              <span className="shrink-0 font-mono text-[11px] text-slate-400">{a.time}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
