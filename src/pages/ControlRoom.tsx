import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { projects, productProjects, explorationProjects, missions, missionsForProject, flightReadiness, activity, decisions, type Status } from '../data'
import Planet from '../components/Planet'
import { useCountUp } from '../lib/motion'

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

/* the orbit cluster is designed at 1160px wide; scale it down on narrower screens */
function useFitScale(design = 1160) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / design)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [design])
  return { ref, scale }
}

/* ── primitives ───────────────────────────────────────────────────────── */
const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--hud-dim)] ${className}`}>{children}</div>
)

function Num({ value }: { value: number }) {
  const v = useCountUp(value)
  return <>{v}</>
}

/* ── page ─────────────────────────────────────────────────────────────── */
export default function ControlRoom() {
  const now = useNow(1000)
  const fit = useFitScale()
  const utc = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`
  const local = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  const onTrack = projects.filter((p) => p.status === 'on-track').length
  const anomalies = missions.filter((m) => m.status !== 'on-track')
  const readyGo = flightReadiness.filter((r) => r.status === 'go').length
  const avgUtil = 84

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

  // six blocks on the ring: products across the top arc, explorations across the bottom
  const RX = 270
  const RY = 180
  const NODES = [
    ...productProjects.map((p, i) => ({ p, a: [-150, -90, -30][i] })),
    ...explorationProjects.map((p, i) => ({ p, a: [150, 90, 30][i] })),
  ].map((n) => ({ ...n, x: Math.cos((n.a * Math.PI) / 180) * RX, y: Math.sin((n.a * Math.PI) / 180) * RY }))

  // stats sit outside the ring; each leader line runs from the stat to the ring
  const STATS: { x: number; y: number; n?: number; v?: string; u: string; k: string; d: string; l: [number, number, number, number] }[] = [
    { x: -520, y: -250, n: onTrack, v: `${onTrack}`, u: `/ ${projects.length}`, k: 'On track', d: `${projects.length - onTrack} project needs attention`, l: [-360, -205, -262, -145] },
    { x: 330, y: -250, n: readyGo, v: `${readyGo}`, u: `/ ${flightReadiness.length}`, k: 'Stations go', d: 'Engineering holding on the supplier delay', l: [330, -205, 262, -145] },
    { x: 350, y: -22, v: next ? `T-${dayT(next.d)}` : '—', u: next ? next.p.code : '', k: 'Next gate', d: next ? next.p.gate : '', l: [342, 0, 272, 0] },
    { x: 330, y: 200, n: anomalies.length, v: `${anomalies.length}`, u: 'open', k: 'Anomalies', d: 'down from 4 last week', l: [330, 205, 262, 145] },
    { x: -520, y: 200, n: avgUtil, v: `${avgUtil}`, u: '%', k: 'Utilisation', d: '39 of 42 engineers committed', l: [-360, 205, -262, 145] },
  ]

  const log = [
    ...activity.slice(0, 4).map((a) => ({ t: a.time, m: a.title })),
    ...anomalies.map((m) => ({ t: 'RISK', m: `${m.name} · due ${m.due}` })),
    ...decisions.map((d) => ({ t: 'CALL', m: d.title })),
  ]

  const nowL = pct(now)

  return (
    <div className="hud relative -mx-8 -my-8 min-h-screen bg-[var(--color-canvas)] px-8 py-6 xl:-mx-12 xl:px-10">
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
            <span className="pulse h-1 w-1 rounded-full" style={{ background: anomalies.length ? 'var(--hud-warn)' : 'var(--hud-ok)' }} />
            {anomalies.length ? 'Hold' : 'Nominal'}
          </div>
        </div>
      </div>

      {/* Orbit view — the six base projects orbit the next gate */}
      <div ref={fit.ref} className="rise relative mt-6 h-[600px] overflow-hidden rounded-[8px] border border-[var(--hud-line)]" style={{ animationDelay: '80ms' }}>
        <div className="stars absolute inset-0 opacity-80" />
        {/* sun, off-frame left */}
        <div
          className="pointer-events-none absolute -left-[14%] -top-[30%] h-[620px] w-[620px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,178,70,0.30) 0%, rgba(255,140,40,0.10) 34%, transparent 62%)' }}
        />
        {/* planet limb on the horizon — atmosphere only */}
        <Planet className="pointer-events-none absolute left-1/2 top-[84%] h-[1600px] w-[1600px] max-w-none -translate-x-1/2" radius={0.46} light={[-0.4, 0.9, 0.35]} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[160px]" style={{ background: 'linear-gradient(to top, rgba(6,10,18,0.55), transparent)' }} />

        {/* band header */}
        <div className="absolute left-5 top-4 flex items-baseline gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--hud-text)]">Orbit view</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--hud-dim)]">Six base projects</span>
        </div>
        <div className="absolute right-5 top-4 flex items-center gap-5 text-[10px] uppercase tracking-[0.18em] text-[var(--hud-dim)]">
          <span className="flex items-center gap-2"><span className="h-1 w-1 rounded-full" style={{ background: 'var(--hud-ok)' }} />On track</span>
          <span className="flex items-center gap-2"><span className="h-1 w-1 rounded-full" style={{ background: 'var(--hud-warn)' }} />At risk</span>
          <span className="flex items-center gap-2"><span className="h-1 w-1 rounded-full" style={{ background: 'var(--hud-bad)' }} />Blocked</span>
        </div>

        {/* everything below is laid out relative to the hub (50%, 50%) */}
        <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: `scale(${fit.scale})` }}>
          {/* ring, spokes, marker, leader lines */}
          <svg className="pointer-events-none absolute" style={{ left: -560, top: -300 }} width="1120" height="600" viewBox="-560 -300 1120 600">
            <defs>
              <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(111,168,255,0.16)" />
                <stop offset="70%" stopColor="rgba(111,168,255,0.04)" />
                <stop offset="100%" stopColor="rgba(111,168,255,0)" />
              </radialGradient>
            </defs>
            <circle r="190" fill="url(#hubGlow)" />
            <ellipse rx="270" ry="180" fill="none" stroke="rgba(116,220,182,0.55)" strokeWidth="1" />
            <ellipse rx="300" ry="205" fill="none" stroke="rgba(116,220,182,0.12)" strokeWidth="0.8" strokeDasharray="2 6" />
            {NODES.map((n) => (
              <line key={n.a} x1={Math.cos((n.a * Math.PI) / 180) * 118} y1={Math.sin((n.a * Math.PI) / 180) * 118} x2={n.x} y2={n.y} stroke="rgba(116,220,182,0.22)" strokeWidth="0.8" />
            ))}
            <circle r="113" fill="rgba(8,13,24,0.55)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <circle r="120" fill="none" stroke="rgba(242,169,59,0.35)" strokeWidth="0.8" strokeDasharray="1 5" />
            <circle r="3.2" fill="#dffff2">
              <animateMotion dur="26s" repeatCount="indefinite" path="M 0,-180 A 270 180 0 1 1 -0.01,-180" />
            </circle>
            <circle r="8" fill="none" stroke="rgba(223,255,242,0.35)" strokeWidth="0.8">
              <animateMotion dur="26s" repeatCount="indefinite" path="M 0,-180 A 270 180 0 1 1 -0.01,-180" />
            </circle>
            {STATS.map((s) => (
              <line key={s.k} x1={s.l[0]} y1={s.l[1]} x2={s.l[2]} y2={s.l[3]} stroke="rgba(116,220,182,0.45)" strokeWidth="0.8" />
            ))}
          </svg>

          {/* hub — T-minus to the next gate */}
          <div className="absolute flex h-[226px] w-[226px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center">
            <Label>T-minus · next gate</Label>
            <div className="mt-2 font-display text-[30px] font-semibold leading-none tracking-tight" style={{ color: 'var(--color-amber)' }}>{countdown}</div>
            <div className="mt-2 px-4 text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-sky)' }}>{next ? next.p.name : ''}</div>
            <div className="mt-1 text-[10.5px] text-[var(--hud-muted)]">{next ? `${next.p.gate} · ${next.p.code}` : ''}</div>
          </div>

          {/* the six blocks, on the ring */}
          {NODES.map(({ p, x, y }) => {
            const t = dayT(gateDate(p))
            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="lift absolute w-[168px] -translate-x-1/2 -translate-y-1/2 rounded-[6px] border border-white/10 bg-[rgba(8,13,24,0.74)] px-3 py-2.5 backdrop-blur-md transition-colors hover:border-[rgba(116,220,182,0.6)]"
                style={{ left: x, top: y }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em]" style={{ color: 'var(--color-amber)' }}>{p.code}</span>
                  <span className="font-mono text-[10px] text-[var(--hud-muted)]">{t >= 0 ? `T-${t}` : 'done'}</span>
                </div>
                <div className="mt-1 truncate text-[12px] font-medium text-[var(--hud-text)]">{p.name}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="pulse h-1.5 w-1.5 rounded-full" style={{ background: hue(p.status) }} />
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-sky)' }}>{p.kind === 'product' ? 'Product' : 'In testing'}</span>
                  <span className="ml-auto font-mono text-[10px] text-[var(--hud-muted)]">{p.progress}%</span>
                </div>
                <div className="mt-1.5 h-px bg-white/10">
                  <div className="h-full" style={{ width: `${p.progress}%`, background: hue(p.status) }} />
                </div>
              </Link>
            )
          })}

          {/* orbiting stats */}
          {STATS.map((s) => (
            <div key={s.k} className="absolute w-[190px]" style={{ left: s.x, top: s.y }}>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-[34px] font-semibold leading-none tracking-tight" style={{ color: 'var(--color-amber)' }}>
                  {s.n !== undefined ? <Num value={s.n} /> : s.v}
                </span>
                <span className="font-mono text-[12px] text-[var(--hud-muted)]">{s.u}</span>
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-sky)' }}>{s.k}</div>
              <div className="mt-1 text-[11.5px] leading-snug text-[var(--hud-muted)]">{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission timeline */}
      <div className="rise mt-8 border-t border-[var(--hud-line)] pt-5" style={{ animationDelay: '220ms' }}>
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
                      <span className="absolute top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[var(--color-canvas)]" style={{ left: `${gl}%`, border: `1px solid ${hue(p.status)}` }} />
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
      <div className="rise mt-8 grid gap-10 border-t border-[var(--hud-line)] pt-5 lg:grid-cols-3" style={{ animationDelay: '300ms' }}>
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
