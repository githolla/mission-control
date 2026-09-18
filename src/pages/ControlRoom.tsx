import { useEffect, useState, type ReactNode } from 'react'
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
function Panel({ num, title, right, children, className = '' }: { num: string; title: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`hud-panel flex flex-col p-3.5 ${className}`}>
      <div className="mb-3 flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--hud-line)' }}>
        <div className="flex items-center gap-2">
          <span className="hud-num flex h-[18px] w-[22px] items-center justify-center rounded-[3px]">{num}</span>
          <span className="hud-label !text-[var(--hud-muted)]">{title}</span>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

/** Thin 270° arc gauge, like a small instrument dial. */
function Gauge({ label, value, display, unit, color }: { label: string; value: number; display: string; unit?: string; color: string }) {
  const r = 30
  const c = 2 * Math.PI * r
  const arc = c * 0.75
  const frac = Math.max(0, Math.min(1, value / 100))
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-[74px] w-[74px]">
        <svg viewBox="0 0 72 72" className="h-full w-full rotate-[135deg]">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(140,165,210,0.14)" strokeWidth="1.5" strokeDasharray={`${arc} ${c}`} />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="butt" strokeDasharray={`${frac * arc} ${c}`} opacity="0.9" />
          {/* tick marks */}
          {Array.from({ length: 7 }).map((_, i) => {
            const a = (i / 6) * 270 * (Math.PI / 180)
            const x1 = 36 + Math.cos(a) * (r - 4)
            const y1 = 36 + Math.sin(a) * (r - 4)
            const x2 = 36 + Math.cos(a) * (r - 6.5)
            const y2 = 36 + Math.sin(a) * (r - 6.5)
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(140,165,210,0.35)" strokeWidth="1" />
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="hud-value text-[14px]">{display}</span>
          {unit && <span className="hud-label mt-1 !text-[8px] !tracking-[0.12em]">{unit}</span>}
        </div>
      </div>
      <span className="hud-label">{label}</span>
    </div>
  )
}

function AreaChart({ data, color }: { data: number[]; color: string }) {
  const w = 300
  const h = 84
  const max = Math.max(...data)
  const min = Math.min(...data)
  const rng = max - min || 1
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 6 - ((v - min) / rng) * (h - 16)] as const)
  const line = pts.map((p) => p.join(',')).join(' ')
  const area = `0,${h} ${line} ${w},${h}`
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-20 w-full">
      <defs>
        <linearGradient id="hudArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.18" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" y1={h * g} x2={w} y2={h * g} stroke="rgba(140,165,210,0.09)" strokeWidth="1" />
      ))}
      <polygon points={area} fill="url(#hudArea)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.1" opacity="0.9" vectorEffect="non-scaling-stroke" />
      <line x1={last[0]} y1="0" x2={last[0]} y2={h} stroke={color} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill="#0b1220" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Radar() {
  return (
    <div className="relative h-[76px] w-[76px] shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {[44, 30, 16].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(140,165,210,0.18)" strokeWidth="1" />
        ))}
        <line x1="50" y1="6" x2="50" y2="94" stroke="rgba(140,165,210,0.12)" strokeWidth="1" />
        <line x1="6" y1="50" x2="94" y2="50" stroke="rgba(140,165,210,0.12)" strokeWidth="1" />
      </svg>
      <div
        className="absolute inset-0 rounded-full animate-[hud-sweep_5s_linear_infinite]"
        style={{ background: 'conic-gradient(from 0deg, rgba(110,168,255,0) 0deg 315deg, rgba(110,168,255,0.16) 352deg, rgba(110,168,255,0) 360deg)' }}
      />
      <span className="absolute left-[63%] top-[35%] h-1 w-1 rounded-full" style={{ background: 'var(--hud-ok)' }} />
      <span className="absolute left-[39%] top-[60%] h-1 w-1 rounded-full" style={{ background: 'var(--hud-warn)' }} />
      <span className="absolute left-[56%] top-[66%] h-1 w-1 rounded-full" style={{ background: 'var(--hud-ok)' }} />
    </div>
  )
}

function Readout({ k, v, tone, align = 'left' }: { k: string; v: string; tone?: string; align?: 'left' | 'right' }) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <div className="hud-label">{k}</div>
      <div className="hud-value mt-0.5 text-[15px] leading-none" style={tone ? { color: tone } : undefined}>
        {v}
      </div>
    </div>
  )
}

/* ── page ─────────────────────────────────────────────────────────────── */
const hoursSeries = [12, 14, 13, 16, 15, 18, 17, 20, 19, 21, 20, 22, 21, 23, 22, 24]

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
    countdown = `${pad(days)}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  }

  const log = [
    ...activity.slice(0, 4).map((a) => ({ t: a.time, m: a.title })),
    ...anomalies.map((m) => ({ t: 'RISK', m: `${m.name} · at risk · due ${m.due}` })),
    ...decisions.map((d) => ({ t: 'CALL', m: d.title })),
  ]

  return (
    <div
      className="hud relative -mx-8 -my-8 min-h-screen overflow-hidden px-5 py-5 xl:-mx-12"
      style={{ background: 'radial-gradient(120% 90% at 50% -10%, #101c31 0%, #0a1222 40%, #070c15 100%)' }}
    >
      <div className="hud-grid pointer-events-none absolute inset-0" />

      <div className="relative space-y-4">
        {/* Header strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-1">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[15px] font-semibold tracking-[0.16em] text-white">MISSION DASHBOARD</span>
            <span className="hud-label">Portfolio telemetry</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="hud-label">UTC</span>
              <span className="hud-value text-[12px]">{utc}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hud-label">Local</span>
              <span className="hud-value text-[12px]">{local}</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-[3px] border px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ borderColor: 'var(--hud-line-strong)', color: 'var(--hud-muted)' }}>
              <span className="h-1 w-1 rounded-full" style={{ background: anomalies.length ? 'var(--hud-warn)' : 'var(--hud-ok)' }} />
              {anomalies.length ? 'Hold' : 'Nominal'}
            </span>
          </div>
        </div>

        {/* Row A */}
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          {/* 01 Orbit view */}
          <Panel num="01" title="Orbit view" right={<span className="hud-label">Portfolio</span>}>
            <div className="grid flex-1 grid-cols-[auto_1fr_auto] items-center gap-5 py-1">
              <div className="space-y-5">
                <Readout k="Projects" v={`${projects.length}`} />
                <Readout k="On track" v={`${onTrack} / ${projects.length}`} />
                <Readout k="Anomalies" v={`${anomalies.length}`} tone="var(--hud-warn)" />
              </div>

              <div className="relative mx-auto aspect-square w-full max-w-[260px]">
                {/* monochrome globe */}
                <div
                  className="absolute inset-[13%] rounded-full bg-cover bg-center"
                  style={{ backgroundImage: 'url(/hero-space.svg)', filter: 'grayscale(0.85) brightness(0.62) contrast(1.15)' }}
                />
                <div className="absolute inset-[13%] rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, rgba(110,168,255,0.10), rgba(7,12,21,0.55) 70%)' }} />
                <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
                  <circle cx="100" cy="100" r="98" fill="none" stroke="rgba(140,165,210,0.14)" strokeWidth="0.75" />
                  {Array.from({ length: 36 }).map((_, i) => {
                    const a = (i / 36) * Math.PI * 2
                    const long = i % 9 === 0
                    const r1 = 98
                    const r2 = long ? 92 : 95
                    return <line key={i} x1={100 + Math.cos(a) * r1} y1={100 + Math.sin(a) * r1} x2={100 + Math.cos(a) * r2} y2={100 + Math.sin(a) * r2} stroke="rgba(140,165,210,0.35)" strokeWidth="0.75" />
                  })}
                  <ellipse cx="100" cy="100" rx="90" ry="34" fill="none" stroke="rgba(110,168,255,0.45)" strokeWidth="0.75" transform="rotate(-22 100 100)" />
                  <ellipse cx="100" cy="100" rx="84" ry="26" fill="none" stroke="rgba(110,168,255,0.22)" strokeWidth="0.75" strokeDasharray="2 3" transform="rotate(20 100 100)" />
                </svg>
                <div className="absolute inset-0 animate-[hud-orbit_16s_linear_infinite]">
                  <span className="absolute left-1/2 top-[7%] h-[5px] w-[5px] -translate-x-1/2 rounded-full" style={{ background: 'var(--hud-accent)' }} />
                </div>
              </div>

              <div className="space-y-5">
                <Readout align="right" k="Stations GO" v={`${readyGo} / ${flightReadiness.length}`} />
                <Readout align="right" k="Next gate" v={next ? `T-${dayT(next.d)}` : '—'} />
                <Readout align="right" k="Lead" v={next ? next.p.code : '—'} />
              </div>
            </div>
          </Panel>

          {/* 02 Systems health */}
          <Panel num="02" title="Systems health" right={<Radar />}>
            <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4 xl:grid-cols-2">
              <Gauge label="On track" value={Math.round((onTrack / projects.length) * 100)} display={`${Math.round((onTrack / projects.length) * 100)}`} unit="%" color="var(--hud-ok)" />
              <Gauge label="Readiness" value={(readyGo / flightReadiness.length) * 100} display={`${readyGo}/${flightReadiness.length}`} unit="GO" color="var(--hud-accent)" />
              <Gauge label="Utilisation" value={avgUtil} display={`${avgUtil}`} unit="%" color="var(--hud-accent)" />
              <Gauge label="Risk" value={riskPct} display={`${riskPct}`} unit="%" color="var(--hud-warn)" />
            </div>
          </Panel>
        </div>

        {/* Row B */}
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          {/* 03 Portfolio timeline */}
          <Panel num="03" title="Portfolio timeline" right={<span className="hud-label">Gates → year-end</span>}>
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                <div className="mb-1.5 flex">
                  <div className="w-[150px] shrink-0" />
                  <div className="relative h-3 flex-1">
                    {[9, 10, 11].map((m) => (
                      <span key={m} className="hud-label absolute -translate-x-1/2" style={{ left: `${pct(new Date(YEAR, m, 1))}%` }}>
                        {MONTHS[m]}
                      </span>
                    ))}
                    <span className="hud-label absolute -translate-x-1/2 !text-[var(--hud-accent)]" style={{ left: `${pct(now)}%` }}>
                      now
                    </span>
                  </div>
                </div>
                <div>
                  {projects.map((p) => {
                    const gd = gateDate(p)
                    const gl = pct(gd)
                    const nowL = pct(now)
                    const t = dayT(gd)
                    const ms = missionsForProject(p)
                      .map((m) => ({ m, d: parseDue(m.due) }))
                      .filter((x): x is { m: (typeof missions)[number]; d: Date } => Boolean(x.d))
                    return (
                      <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center border-t hover:bg-white/[0.025]" style={{ borderColor: 'var(--hud-line)' }}>
                        <div className="flex w-[150px] shrink-0 items-center gap-2 py-1.5 pr-3">
                          <span className="hud-mono text-[10px]" style={{ color: 'var(--hud-muted)' }}>{p.code}</span>
                          <span className="truncate text-[11.5px]" style={{ color: 'var(--hud-text)' }}>{p.name}</span>
                        </div>
                        <div className="relative h-8 flex-1">
                          {[9, 10, 11].map((m) => (
                            <div key={m} className="absolute inset-y-0 w-px" style={{ left: `${pct(new Date(YEAR, m, 1))}%`, background: 'var(--hud-line)' }} />
                          ))}
                          <div className="absolute inset-y-0 w-px" style={{ left: `${nowL}%`, background: 'var(--hud-accent-dim)' }} />
                          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2" style={{ background: 'var(--hud-line)' }} />
                          <div className="absolute top-1/2 h-px -translate-y-1/2" style={{ left: `${nowL}%`, width: `${Math.max(0, gl - nowL)}%`, background: hue(p.status), opacity: 0.85 }} />
                          {ms.map(({ m, d }) => (
                            <span key={m.id} className="absolute top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${pct(d)}%`, background: hue(m.status) }} title={m.name} />
                          ))}
                          <span className="absolute top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ left: `${gl}%`, background: '#0b1220', border: `1px solid ${hue(p.status)}` }} />
                          <span className="hud-mono absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[9.5px]" style={{ left: `calc(${gl}% + 0.45rem)`, color: 'var(--hud-muted)' }}>
                            {t >= 0 ? `T-${t}` : 'done'}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Station readiness strip */}
            <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-1.5 border-t pt-3" style={{ borderColor: 'var(--hud-line)' }}>
              <span className="hud-label">Stations</span>
              {flightReadiness.map((r) => {
                const c = r.status === 'go' ? 'var(--hud-ok)' : r.status === 'watch' ? 'var(--hud-warn)' : 'var(--hud-bad)'
                return (
                  <span key={r.domain} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full" style={{ background: c }} />
                    <span className="text-[11px]" style={{ color: 'var(--hud-muted)' }}>{r.domain}</span>
                    <span className="hud-mono text-[10px]" style={{ color: c }}>{r.status.toUpperCase()}</span>
                  </span>
                )
              })}
            </div>
          </Panel>

          {/* 04 Telemetry + log */}
          <Panel num="04" title="Telemetry" right={<span className="hud-mono text-[11px]" style={{ color: 'var(--hud-muted)' }}>+6 / wk</span>}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="hud-label">Hours saved / week</span>
              <span className="hud-value text-[18px] leading-none">24</span>
            </div>
            <AreaChart data={hoursSeries} color="var(--hud-accent)" />

            <div className="mt-3 border-t pt-2.5" style={{ borderColor: 'var(--hud-line)' }}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="hud-label">Event log</span>
                <span className="hud-mono text-[9.5px]" style={{ color: 'var(--hud-dim)' }}>{log.length} entries</span>
              </div>
              <ul className="hud-mono space-y-[3px] text-[10.5px]">
                {log.map((l, i) => (
                  <li key={i} className="flex gap-3 leading-snug">
                    <span className="w-14 shrink-0" style={{ color: l.t === 'RISK' ? 'var(--hud-warn)' : l.t === 'CALL' ? 'var(--hud-accent)' : 'var(--hud-dim)' }}>
                      {l.t}
                    </span>
                    <span className="truncate" style={{ color: 'var(--hud-muted)' }}>{l.m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </div>

        {/* Mission clock bar */}
        <div className="hud-panel flex flex-wrap items-center justify-between gap-4 px-4 py-2.5">
          <span className="hud-label">Next gate · {next ? next.p.name : '—'}</span>
          <div className="flex items-center gap-3">
            <span className="hud-label">T-minus</span>
            <span className="hud-value text-[17px] tracking-wider" style={{ color: 'var(--hud-accent)' }}>{countdown}</span>
          </div>
          <span className="hud-label">Link nominal · {readyGo}/{flightReadiness.length} GO</span>
        </div>
      </div>
    </div>
  )
}
