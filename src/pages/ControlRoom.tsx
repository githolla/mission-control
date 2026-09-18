import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projects, missions, missionsForProject, flightReadiness, activity, type Status } from '../data'

/* ── time / scale helpers ─────────────────────────────────────────────── */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEAR = new Date().getFullYear()
const START = new Date(YEAR, 8, 15)
const END = new Date(YEAR, 11, 31)
const SPAN = END.getTime() - START.getTime()
const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - START.getTime()) / SPAN) * 100))
const pad = (n: number) => String(n).padStart(2, '0')
const gateDate = (p: (typeof projects)[number]) => new Date(YEAR, p.gateMonth - 1, p.gateDay)
const dhue = (s: Status) => (s === 'on-track' ? 'var(--hud-ok)' : s === 'at-risk' ? 'var(--hud-warn)' : 'var(--hud-bad)')

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
function Panel({
  num,
  title,
  right,
  children,
  className = '',
}: {
  num: string
  title: string
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`hud-panel p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="hud-num flex h-6 w-7 items-center justify-center rounded text-[12px]">{num}</span>
          <span className="hud-label !tracking-[0.18em] text-slate-300">{title}</span>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function Gauge({ label, value, display, color }: { label: string; value: number; display: string; color: string }) {
  const r = 34
  const c = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, value / 100))
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[86px] w-[86px]">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${frac * c} ${c}`}
            style={{ filter: `drop-shadow(0 0 5px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="hud-value text-[17px] font-medium">{display}</span>
        </div>
      </div>
      <span className="hud-label text-center">{label}</span>
    </div>
  )
}

function AreaChart({ data, color }: { data: number[]; color: string }) {
  const w = 300
  const h = 90
  const max = Math.max(...data)
  const min = Math.min(...data)
  const rng = max - min || 1
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 8 - ((v - min) / rng) * (h - 18)] as const)
  const line = pts.map((p) => p.join(',')).join(' ')
  const area = `0,${h} ${line} ${w},${h}`
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-24 w-full">
      <defs>
        <linearGradient id="hudArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" y1={h * g} x2={w} y2={h * g} stroke="rgba(120,170,255,0.10)" strokeWidth="1" />
      ))}
      <polygon points={area} fill="url(#hudArea)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  )
}

function Radar() {
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {[40, 28, 16].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(120,170,255,0.2)" strokeWidth="1" />
        ))}
        <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(120,170,255,0.15)" strokeWidth="1" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(120,170,255,0.15)" strokeWidth="1" />
      </svg>
      <div
        className="absolute inset-0 rounded-full animate-[hud-sweep_4s_linear_infinite]"
        style={{ background: 'conic-gradient(from 0deg, rgba(56,182,255,0) 0deg 300deg, rgba(56,182,255,0.28) 348deg, rgba(56,182,255,0) 360deg)' }}
      />
      <span className="absolute left-[64%] top-[36%] h-1.5 w-1.5 rounded-full bg-[var(--hud-ok)]" style={{ boxShadow: '0 0 6px var(--hud-ok)' }} />
      <span className="absolute left-[38%] top-[60%] h-1.5 w-1.5 rounded-full bg-[var(--hud-warn)]" style={{ boxShadow: '0 0 6px var(--hud-warn)' }} />
      <span className="absolute left-[56%] top-[64%] h-1 w-1 rounded-full bg-[var(--hud-ok)]" />
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

  // nearest upcoming gate + live countdown
  const upcoming = projects
    .map((p) => ({ p, d: gateDate(p) }))
    .filter((x) => x.d.getTime() >= now.getTime())
    .sort((a, b) => a.d.getTime() - b.d.getTime())
  const next = upcoming[0]
  let mission = '—'
  if (next) {
    const diff = Math.max(0, next.d.getTime() - now.getTime())
    const days = Math.floor(diff / 86_400_000)
    const hrs = Math.floor((diff % 86_400_000) / 3_600_000)
    const mins = Math.floor((diff % 3_600_000) / 60_000)
    const secs = Math.floor((diff % 60_000) / 1000)
    mission = `${days}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  }

  const readouts = [
    { k: 'Projects', v: `${projects.length}` },
    { k: 'On track', v: `${onTrack}/${projects.length}` },
    { k: 'Anomalies', v: `${anomalies.length}`, warn: true },
    { k: 'Stations GO', v: `${readyGo}/${flightReadiness.length}` },
    { k: 'Next gate', v: next ? `T-${Math.ceil((next.d.getTime() - now.getTime()) / 86_400_000)}` : '—' },
    { k: 'Lead', v: next ? next.p.code : '—' },
  ]

  return (
    <div
      className="hud relative -mx-8 -my-8 min-h-screen overflow-hidden px-6 py-6 xl:-mx-12"
      style={{ background: 'radial-gradient(130% 110% at 50% -15%, #12294a 0%, #0b1728 45%, #070e18 100%)' }}
    >
      <div className="hud-grid pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative space-y-5">
        {/* Top strip */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl font-bold tracking-[0.12em] text-white">MISSION DASHBOARD</span>
            <span className="hud-label">Portfolio telemetry</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="hud-label">UTC</div>
              <div className="hud-value text-sm">{utc}</div>
            </div>
            <div className="text-right">
              <div className="hud-label">Local</div>
              <div className="hud-value text-sm">{local}</div>
            </div>
            <span
              className="rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ borderColor: 'var(--hud-line)', color: anomalies.length ? 'var(--hud-warn)' : 'var(--hud-ok)' }}
            >
              {anomalies.length ? 'System · hold' : 'System · nominal'}
            </span>
          </div>
        </div>

        {/* Row A */}
        <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          {/* 01 Orbit view */}
          <Panel num="01" title="Orbit view" right={<span className="hud-label">Portfolio</span>}>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <div className="space-y-4">
                {readouts.slice(0, 3).map((r) => (
                  <div key={r.k}>
                    <div className="hud-label">{r.k}</div>
                    <div className="hud-value text-lg" style={r.warn ? { color: 'var(--hud-warn)' } : undefined}>
                      {r.v}
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative mx-auto aspect-square w-full max-w-[300px]">
                <div className="absolute inset-[10%] rounded-full bg-cover bg-center" style={{ backgroundImage: 'url(/hero-space.svg)' }} />
                <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
                  <ellipse cx="100" cy="100" rx="94" ry="40" fill="none" stroke="rgba(56,182,255,0.35)" strokeWidth="1" transform="rotate(-24 100 100)" />
                  <ellipse cx="100" cy="100" rx="88" ry="30" fill="none" stroke="rgba(56,182,255,0.2)" strokeWidth="1" transform="rotate(18 100 100)" />
                  <circle cx="100" cy="100" r="97" fill="none" stroke="rgba(120,170,255,0.15)" strokeWidth="1" />
                </svg>
                <div className="absolute inset-0 animate-[hud-orbit_14s_linear_infinite]">
                  <span
                    className="absolute left-1/2 top-[3%] h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--hud-accent)]"
                    style={{ boxShadow: '0 0 8px var(--hud-accent)' }}
                  />
                </div>
              </div>

              <div className="space-y-4 text-right">
                {readouts.slice(3).map((r) => (
                  <div key={r.k}>
                    <div className="hud-label">{r.k}</div>
                    <div className="hud-value text-lg">{r.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* 02 Systems health */}
          <Panel num="02" title="Systems health" right={<Radar />}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-2">
              <Gauge label="On track" value={Math.round((onTrack / projects.length) * 100)} display={`${Math.round((onTrack / projects.length) * 100)}%`} color="var(--hud-ok)" />
              <Gauge label="Readiness" value={(readyGo / flightReadiness.length) * 100} display={`${readyGo}/${flightReadiness.length}`} color="var(--hud-accent)" />
              <Gauge label="Utilisation" value={avgUtil} display={`${avgUtil}%`} color="var(--hud-accent)" />
              <Gauge label="Risk" value={riskPct} display={`${riskPct}%`} color="var(--hud-warn)" />
            </div>
          </Panel>
        </div>

        {/* Row B */}
        <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          {/* 03 Portfolio timeline */}
          <Panel num="03" title="Portfolio timeline" right={<span className="hud-label">Gates → year-end</span>}>
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                <div className="mb-2 flex">
                  <div className="w-[150px] shrink-0" />
                  <div className="relative h-3 flex-1">
                    {[9, 10, 11].map((m) => (
                      <span key={m} className="hud-label absolute -translate-x-1/2" style={{ left: `${pct(new Date(YEAR, m, 1))}%` }}>
                        {MONTHS[m]}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-[color:var(--hud-line)]">
                  {projects.map((p) => {
                    const gd = gateDate(p)
                    const gl = pct(gd)
                    const nowL = pct(now)
                    const t = Math.ceil((gd.getTime() - now.getTime()) / 86_400_000)
                    const ms = missionsForProject(p)
                      .map((m) => ({ m, d: parseDue(m.due) }))
                      .filter((x): x is { m: (typeof missions)[number]; d: Date } => Boolean(x.d))
                    return (
                      <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center hover:bg-white/[0.03]">
                        <div className="flex w-[150px] shrink-0 items-center gap-2 py-2 pr-3">
                          <span className="hud-value flex h-6 w-7 items-center justify-center rounded border text-[10px]" style={{ borderColor: 'var(--hud-line)' }}>
                            {p.code}
                          </span>
                          <span className="truncate text-[12px] text-slate-300">{p.name}</span>
                        </div>
                        <div className="relative h-9 flex-1">
                          <div className="absolute inset-y-0 w-px" style={{ left: `${nowL}%`, background: 'var(--hud-accent)' }} />
                          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2" style={{ background: 'var(--hud-line)' }} />
                          <div className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full" style={{ left: `${nowL}%`, width: `${Math.max(0, gl - nowL)}%`, background: dhue(p.status), boxShadow: `0 0 6px ${dhue(p.status)}` }} />
                          {ms.map(({ m, d }) => (
                            <span key={m.id} className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${pct(d)}%`, background: dhue(m.status), boxShadow: `0 0 5px ${dhue(m.status)}` }} title={m.name} />
                          ))}
                          <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px]" style={{ left: `${gl}%`, background: dhue(p.status), boxShadow: `0 0 7px ${dhue(p.status)}` }} />
                          <span className="hud-value absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px]" style={{ left: `calc(${gl}% + 0.5rem)` }}>
                            {t >= 0 ? `T-${t}` : 'done'}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </Panel>

          {/* 04 Telemetry */}
          <Panel
            num="04"
            title="Telemetry"
            right={
              <span className="hud-value text-sm" style={{ color: 'var(--hud-accent)' }}>
                +6/wk
              </span>
            }
          >
            <div className="mb-2 flex items-baseline gap-2">
              <span className="hud-label">Hours saved / week</span>
              <span className="hud-value ml-auto text-2xl font-medium">24</span>
            </div>
            <AreaChart data={hoursSeries} color="var(--hud-accent)" />
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { k: 'Decisions', v: '3' },
                { k: 'Gates ≤30d', v: `${upcoming.filter((u) => (u.d.getTime() - now.getTime()) / 86_400_000 <= 30).length}` },
                { k: 'Activity', v: `${activity.length}` },
              ].map((s) => (
                <div key={s.k} className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--hud-line)' }}>
                  <div className="hud-label">{s.k}</div>
                  <div className="hud-value text-base">{s.v}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Mission clock bar */}
        <div className="hud-panel flex flex-wrap items-center justify-between gap-4 px-5 py-3">
          <span className="hud-label">Next gate · {next ? next.p.name : '—'}</span>
          <div className="flex items-center gap-3">
            <span className="hud-label">T-minus</span>
            <span className="hud-value text-2xl font-medium tracking-wide" style={{ color: 'var(--hud-accent)', textShadow: '0 0 14px rgba(56,182,255,0.5)' }}>
              {mission}
            </span>
          </div>
          <span className="hud-label">Link · nominal · {readyGo}/{flightReadiness.length} GO</span>
        </div>
      </div>
    </div>
  )
}
