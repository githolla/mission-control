import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projects, missions, missionsForProject, flightReadiness, activity, decisions, type Status } from '../data'

/* ── time / scale helpers ─────────────────────────────────────────────── */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEAR = new Date().getFullYear()
const START = new Date(YEAR, 8, 15)
const END = new Date(YEAR, 11, 31)
const SPAN = END.getTime() - START.getTime()
const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - START.getTime()) / SPAN) * 100))
const pad = (n: number) => String(n).padStart(2, '0')
const gateDate = (p: (typeof projects)[number]) => new Date(YEAR, p.gateMonth - 1, p.gateDay)
const hue = (s: Status) => (s === 'on-track' ? 'var(--hud-ok)' : s === 'at-risk' ? 'var(--hud-warn)' : 'var(--hud-bad)')

function parseDue(due: string): Date | null {
  const m = due.trim().match(/^([A-Za-z]{3})\s+(\d{1,2})$/)
  if (!m) return null
  const mi = MONTHS.indexOf(m[1])
  return mi < 0 ? null : new Date(YEAR, mi, parseInt(m[2], 10))
}

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return now
}

/* ── primitives ───────────────────────────────────────────────────────── */
const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--hud-dim)] ${className}`}>{children}</div>
)

/** Thin monochrome arc — SpaceX webcast style. */
function Arc({ label, value, display, unit }: { label: string; value: number; display: string; unit?: string }) {
  const r = 30
  const c = 2 * Math.PI * r
  const arc = c * 0.75
  const frac = Math.max(0, Math.min(1, value / 100))
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[76px] w-[76px]">
        <svg viewBox="0 0 72 72" className="h-full w-full rotate-[135deg]">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#2a2a2a" strokeWidth="1.25" strokeDasharray={`${arc} ${c}`} />
          <circle cx="36" cy="36" r={r} fill="none" stroke="#f2f2f2" strokeWidth="1.25" strokeDasharray={`${frac * arc} ${c}`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-mono text-[15px] text-[var(--hud-text)]">{display}</span>
          {unit && <span className="mt-1 text-[8px] uppercase tracking-[0.14em] text-[var(--hud-dim)]">{unit}</span>}
        </div>
      </div>
      <Label>{label}</Label>
    </div>
  )
}

/* ── page ─────────────────────────────────────────────────────────────── */
export default function ControlRoom() {
  const now = useNow(1000)
  const utc = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`
  const local = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  const onTrack = projects.filter((p) => p.status === 'on-track').length
  const anomalies = missions.filter((m) => m.status !== 'on-track')
  const readyGo = flightReadiness.filter((r) => r.status === 'go').length
  const avgUtil = 84
  const riskPct = Math.round((anomalies.length / missions.length) * 100)

  const upcoming = projects
    .map((p) => ({ p, d: gateDate(p) }))
    .filter((x) => x.d.getTime() >= now.getTime())
    .sort((a, b) => a.d.getTime() - b.d.getTime())
  const next = upcoming[0]
  const dayT = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / 86_400_000)
  let countdown = '—'
  if (next) {
    const diff = Math.max(0, next.d.getTime() - now.getTime())
    const days = Math.floor(diff / 86_400_000)
    const hrs = Math.floor((diff % 86_400_000) / 3_600_000)
    const mins = Math.floor((diff % 3_600_000) / 60_000)
    const secs = Math.floor((diff % 60_000) / 1000)
    countdown = `${pad(days)}:${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  }

  const telemetry = [
    { k: 'On track', v: `${onTrack}`, u: `/ ${projects.length}` },
    { k: 'Stations go', v: `${readyGo}`, u: `/ ${flightReadiness.length}` },
    { k: 'Utilisation', v: `${avgUtil}`, u: '%' },
    { k: 'Anomalies', v: `${anomalies.length}`, u: 'open', warn: anomalies.length > 0 },
    { k: 'Next gate', v: next ? `T-${dayT(next.d)}` : '—', u: next ? next.p.code : '' },
  ]

  const log = [
    ...activity.slice(0, 4).map((a) => ({ t: a.time, m: a.title })),
    ...anomalies.map((m) => ({ t: 'RISK', m: `${m.name} · due ${m.due}` })),
    ...decisions.map((d) => ({ t: 'CALL', m: d.title })),
  ]

  const nowL = pct(now)

  return (
    <div className="hud relative -mx-8 -my-8 min-h-screen bg-[#050505] px-8 py-6 xl:-mx-12 xl:px-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--hud-text)]">Mission control</span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--hud-dim)]">Portfolio</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--hud-dim)]">UTC</span>
            <span className="font-mono text-[12px] text-[var(--hud-text)]">{utc}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--hud-dim)]">Local</span>
            <span className="font-mono text-[12px] text-[var(--hud-text)]">{local}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--hud-muted)]">
            <span className="h-1 w-1 rounded-full" style={{ background: anomalies.length ? 'var(--hud-warn)' : 'var(--hud-ok)' }} />
            {anomalies.length ? 'Hold' : 'Nominal'}
          </div>
        </div>
      </div>

      {/* Telemetry strip */}
      <div className="mt-6 grid grid-cols-2 border-y border-[var(--hud-line)] sm:grid-cols-3 xl:grid-cols-5">
        {telemetry.map((t, i) => (
          <div key={t.k} className={`py-5 pr-6 ${i > 0 ? 'xl:border-l xl:border-[var(--hud-line)] xl:pl-6' : ''}`}>
            <Label>{t.k}</Label>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-[34px] font-medium leading-none tracking-tight" style={{ color: t.warn ? 'var(--hud-warn)' : 'var(--hud-text)' }}>
                {t.v}
              </span>
              <span className="font-mono text-[12px] text-[var(--hud-dim)]">{t.u}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Hero band: countdown over the planet */}
      <div className="relative mt-6 h-[300px] overflow-hidden rounded-[6px]">
        <div
          className="absolute inset-0 bg-cover bg-bottom"
          style={{ backgroundImage: 'url(/hero-space.svg)', filter: 'grayscale(1) brightness(0.55) contrast(1.1)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.6) 45%, rgba(5,5,5,0.15) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,5,5,0.6) 0%, rgba(5,5,5,0) 40%)' }} />

        <div className="relative flex h-full items-end justify-between px-8 pb-8">
          <div>
            <Label>T-minus · {next ? next.p.gate : '—'}</Label>
            <div className="mt-2 font-mono text-[56px] font-light leading-none tracking-[0.04em] text-[var(--hud-text)]">{countdown}</div>
            <div className="mt-3 text-[13px] text-[var(--hud-muted)]">
              {next ? (
                <>
                  <span className="text-[var(--hud-text)]">{next.p.name}</span> · {next.p.kind === 'product' ? 'Product' : 'In testing'} · {next.p.stage} · {next.p.lead}
                </>
              ) : (
                'No upcoming gates'
              )}
            </div>
          </div>
          <div className="hidden items-end gap-8 lg:flex">
            <Arc label="On track" value={Math.round((onTrack / projects.length) * 100)} display={`${Math.round((onTrack / projects.length) * 100)}`} unit="%" />
            <Arc label="Readiness" value={(readyGo / flightReadiness.length) * 100} display={`${readyGo}/${flightReadiness.length}`} unit="go" />
            <Arc label="Utilisation" value={avgUtil} display={`${avgUtil}`} unit="%" />
            <Arc label="Risk" value={riskPct} display={`${riskPct}`} unit="%" />
          </div>
        </div>
      </div>

      {/* Mission timeline */}
      <div className="mt-8 border-t border-[var(--hud-line)] pt-5">
        <div className="flex items-center justify-between">
          <Label>Portfolio timeline</Label>
          <Label>Gates → year-end</Label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex">
              <div className="w-[240px] shrink-0" />
              <div className="relative h-4 flex-1">
                {[9, 10, 11].map((m) => (
                  <span key={m} className="absolute -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-[var(--hud-dim)]" style={{ left: `${pct(new Date(YEAR, m, 1))}%` }}>
                    {MONTHS[m]}
                  </span>
                ))}
                <span className="absolute -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-[var(--hud-text)]" style={{ left: `${nowL}%` }}>
                  Now
                </span>
              </div>
            </div>

            <div className="mt-1">
              {projects.map((p) => {
                const gd = gateDate(p)
                const gl = pct(gd)
                const t = dayT(gd)
                const ms = missionsForProject(p)
                  .map((m) => ({ m, d: parseDue(m.due) }))
                  .filter((x): x is { m: (typeof missions)[number]; d: Date } => Boolean(x.d))
                return (
                  <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center border-t border-[var(--hud-line)] transition-colors hover:bg-white/[0.02]">
                    <div className="flex w-[240px] shrink-0 items-center gap-3 py-3 pr-4">
                      <span className="font-mono text-[10px] text-[var(--hud-dim)]">{p.code}</span>
                      <span className="truncate text-[12.5px] text-[var(--hud-text)]">{p.name}</span>
                    </div>
                    <div className="relative h-10 flex-1">
                      {[9, 10, 11].map((m) => (
                        <div key={m} className="absolute inset-y-0 w-px bg-[var(--hud-line)]" style={{ left: `${pct(new Date(YEAR, m, 1))}%` }} />
                      ))}
                      <div className="absolute inset-y-0 w-px bg-[var(--hud-accent-dim)]" style={{ left: `${nowL}%` }} />
                      <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[var(--hud-line-strong)]" />
                      <div className="absolute top-1/2 h-px -translate-y-1/2" style={{ left: `${nowL}%`, width: `${Math.max(0, gl - nowL)}%`, background: hue(p.status) }} />
                      {ms.map(({ m, d }) => (
                        <span key={m.id} className="absolute top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${pct(d)}%`, background: hue(m.status) }} title={m.name} />
                      ))}
                      <span className="absolute top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#050505]" style={{ left: `${gl}%`, border: `1px solid ${hue(p.status)}` }} />
                      <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] text-[var(--hud-muted)]" style={{ left: `calc(${gl}% + 0.5rem)` }}>
                        {t >= 0 ? `T-${t}` : 'done'}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: stations · calls · log */}
      <div className="mt-8 grid gap-10 border-t border-[var(--hud-line)] pt-5 lg:grid-cols-3">
        <div>
          <Label>Stations</Label>
          <ul className="mt-3 divide-y divide-[var(--hud-line)]">
            {flightReadiness.map((r) => {
              const c = r.status === 'go' ? 'var(--hud-ok)' : r.status === 'watch' ? 'var(--hud-warn)' : 'var(--hud-bad)'
              return (
                <li key={r.domain} className="flex items-center gap-3 py-2.5">
                  <span className="h-1 w-1 rounded-full" style={{ background: c }} />
                  <span className="w-24 text-[12.5px] text-[var(--hud-text)]">{r.domain}</span>
                  <span className="w-14 font-mono text-[10.5px] tracking-[0.1em]" style={{ color: c }}>{r.status.toUpperCase()}</span>
                  <span className="hidden flex-1 truncate text-[12px] text-[var(--hud-dim)] xl:block">{r.note}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <Label>Needs your call</Label>
          <ul className="mt-3 divide-y divide-[var(--hud-line)]">
            {decisions.map((d) => (
              <li key={d.id}>
                <Link to="/decisions" className="flex items-center gap-3 py-2.5 hover:text-white">
                  <span className="font-mono text-[10px] text-[var(--hud-dim)]">CALL</span>
                  <span className="flex-1 truncate text-[12.5px] text-[var(--hud-text)]">{d.title}</span>
                  <span className="text-[var(--hud-dim)]">→</span>
                </Link>
              </li>
            ))}
            {anomalies.map((m) => (
              <li key={m.id}>
                <Link to={`/missions/${m.id}`} className="flex items-center gap-3 py-2.5 hover:text-white">
                  <span className="font-mono text-[10px]" style={{ color: 'var(--hud-warn)' }}>RISK</span>
                  <span className="flex-1 truncate text-[12.5px] text-[var(--hud-text)]">{m.name}</span>
                  <span className="text-[var(--hud-dim)]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Event log</Label>
            <span className="font-mono text-[10px] text-[var(--hud-dim)]">{log.length}</span>
          </div>
          <ul className="mt-3 space-y-[5px] font-mono text-[11px]">
            {log.map((l, i) => (
              <li key={i} className="flex gap-4 leading-snug">
                <span className="w-12 shrink-0" style={{ color: l.t === 'RISK' ? 'var(--hud-warn)' : l.t === 'CALL' ? 'var(--hud-text)' : 'var(--hud-dim)' }}>
                  {l.t}
                </span>
                <span className="truncate text-[var(--hud-muted)]">{l.m}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
