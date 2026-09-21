import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { projects, teams, type Status } from '../data'
import { forecasts, riskMatrix, riskCategories, detectAnomalies, resourceForecast, simulate, generateBrief, questionsToAsk, engineersOn, fmt, type Audience, type Forecast } from '../lib/intel'
import { Card, SectionHeading } from '../components/ui'
import { SparkleIcon, ArrowRightIcon } from '../components/icons'
import { useToast } from '../components/Toast'
import ChatModal from '../components/ChatModal'

const hue = (s: Status) => (s === 'on-track' ? 'var(--color-ok)' : s === 'at-risk' ? 'var(--color-warn)' : 'var(--color-bad)')
const riskColor = (r: number) => (r >= 60 ? 'var(--color-bad)' : r >= 35 ? 'var(--color-warn)' : 'var(--color-ok)')
const cellBg = ['transparent', 'rgba(111,168,255,0.16)', 'rgba(217,165,75,0.32)', 'rgba(224,112,112,0.5)']
const sev = { high: 'var(--color-bad)', medium: 'var(--color-warn)', low: 'var(--color-ok)' }

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="eyebrow flex items-center gap-2">
    <SparkleIcon width={12} height={12} className="text-fg-3" />
    {children}
  </div>
)

function Tile({ label, value, unit, note, warn }: { label: string; value: string | number; unit?: string; note: string; warn?: boolean }) {
  return (
    <Card className="p-5">
      <div className="text-[12.5px] font-medium text-[var(--color-muted)]">{label}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-display text-[2rem] font-semibold leading-none tracking-tight" style={{ color: warn ? 'var(--color-warn)' : 'var(--color-fg)' }}>{value}</span>
        {unit && <span className="font-mono text-xs text-[var(--color-muted)]">{unit}</span>}
      </div>
      <div className="mt-2 text-xs leading-snug text-[var(--color-muted)]">{note}</div>
    </Card>
  )
}

function ForecastRow({ f }: { f: Forecast }) {
  const p = f.project
  return (
    <Link to={`/projects/${p.id}`} className="grid grid-cols-[150px_1fr_64px_120px_84px_84px_110px] items-center gap-4 border-t border-line px-2 py-3 text-[12.5px] transition-colors hover:bg-surface-2">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[10.5px] font-semibold" style={{ color: 'var(--color-amber)' }}>{p.code}</span>
        <span className="truncate text-fg">{p.name}</span>
      </div>
      <div>
        <div className="relative h-[6px] rounded-full bg-line">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${p.progress}%`, background: hue(p.status) }} />
          <div className="absolute -top-[3px] h-3 w-px bg-fg" style={{ left: `${f.expected}%` }} title={`Plan line ${f.expected}%`} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-dim">
          <span>{p.progress}% actual</span>
          <span>plan {f.expected}%</span>
        </div>
      </div>
      <span className="font-mono text-fg-2">{f.spi.toFixed(2)}</span>
      <span className="text-[var(--color-muted)]">{p.gate}</span>
      <span className="font-mono" style={{ color: f.slipDays ? 'var(--color-warn)' : 'var(--color-ok)' }}>{f.slipDays ? `+${f.slipDays}d · ${fmt(f.predictedGate)}` : 'holds'}</span>
      <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-muted)]">{f.confidence}</span>
      <div className="flex items-center gap-2">
        <div className="h-[6px] flex-1 rounded-full bg-line">
          <div className="h-full rounded-full" style={{ width: `${f.riskScore}%`, background: riskColor(f.riskScore) }} />
        </div>
        <span className="w-6 text-right font-mono text-[11px] text-fg-2">{f.riskScore}</span>
      </div>
    </Link>
  )
}

export default function Analysis() {
  const { notify } = useToast()
  const fs = useMemo(() => forecasts(), [])
  const matrix = useMemo(() => riskMatrix(), [])
  const anomalies = useMemo(() => detectAnomalies(), [])
  const questions = useMemo(() => questionsToAsk(), [])
  const engProjects = projects.filter((p) => engineersOn[p.id] !== undefined)

  const [from, setFrom] = useState('p-sensor')
  const [to, setTo] = useState('p-proto')
  const [n, setN] = useState(3)
  const sim = useMemo(() => simulate({ from, to, n }), [from, to, n])

  const [audience, setAudience] = useState<Audience>('board')
  const briefText = useMemo(() => generateBrief(audience), [audience])

  const [chat, setChat] = useState<{ open: boolean; seed?: string }>({ open: false })

  const holds = fs.filter((f) => f.slipDays === 0).length
  const slipDays = fs.reduce((a, f) => a + f.slipDays, 0)
  const top = [...fs].sort((a, b) => b.riskScore - a.riskScore)[0]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="AI analysis" title="Forecasts, risk and scenarios" subtitle="Computed live from the board — schedule forecasts, a risk heatmap, anomaly detection, a what-if simulator, resource forecasting and briefings you can send." />
        <button onClick={() => setChat({ open: true })} className="btn btn-primary">
          Ask the analyst
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Gates forecast to hold" value={holds} unit={`/ ${fs.length}`} note={holds === fs.length ? 'Every gate holds on current velocity.' : `${fs.length - holds} gate slips without action: ${fs.filter((f) => f.slipDays).map((f) => f.project.code).join(', ')}.`} />
        <Tile label="Portfolio slip exposure" value={slipDays} unit="days" note="Sum of unmitigated slip across all gates. Mitigations on the console recover most of it." warn={slipDays > 0} />
        <Tile label="Anomalies detected" value={anomalies.length} unit="open" note={`${anomalies.filter((a) => a.severity === 'high').length} high · ${anomalies.filter((a) => a.severity === 'medium').length} medium. Scanned missions, teams, gates, readiness and decisions.`} />
        <Tile label="Highest risk" value={top.project.code} unit={`${top.riskScore} / 100`} note={top.drivers[0]} warn={top.riskScore >= 50} />
      </div>

      {/* Schedule forecast */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <Eyebrow>Schedule forecast</Eyebrow>
          <span className="text-[11px] text-dim">Plan line assumes a 120-day run to each gate · SPI = actual ÷ expected</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[150px_1fr_64px_120px_84px_84px_110px] gap-4 px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
              <span>Project</span>
              <span>Progress vs plan</span>
              <span>SPI</span>
              <span>Gate</span>
              <span>Forecast</span>
              <span>Confidence</span>
              <span>Risk score</span>
            </div>
            {[...fs].sort((a, b) => b.riskScore - a.riskScore).map((f) => (
              <ForecastRow key={f.project.id} f={f} />
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr] xl:items-start">
        {/* Risk heatmap */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Risk heatmap</Eyebrow>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-dim">
              {['clear', 'watch', 'elevated', 'severe'].map((l, i) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-line" style={{ background: cellBg[i] }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-line bg-line" style={{ gridTemplateColumns: `170px repeat(${riskCategories.length}, 1fr) 56px` }}>
            <div className="bg-surface px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">Project</div>
            {riskCategories.map((c) => (
              <div key={c} className="bg-surface px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">{c}</div>
            ))}
            <div className="bg-surface px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">Σ</div>
            {[...matrix].sort((a, b) => b.total - a.total).map((row) => (
              <RowCells key={row.project.id} row={row} />
            ))}
          </div>
        </Card>

        {/* Anomalies */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Anomaly detection</Eyebrow>
            <span className="font-mono text-xs text-dim">{anomalies.length}</span>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {anomalies.map((a) => (
              <li key={a.id}>
                <Link to={a.to} className="group -mx-2 flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-surface-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: sev[a.severity] }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-sky)' }}>{a.kind}</span>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-dim">{a.severity}</span>
                    </span>
                    <span className="mt-0.5 block text-[13px] font-medium text-fg">{a.title}</span>
                    <span className="block text-xs leading-snug text-[var(--color-muted)]">{a.detail}</span>
                  </span>
                  <ArrowRightIcon width={14} height={14} className="mt-1 shrink-0 text-dim transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* What-if simulator */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Eyebrow>What-if simulator · move engineers between projects</Eyebrow>
          <span className="text-[11px] text-dim">Engineering owns {engProjects.map((p) => `${p.code} (${engineersOn[p.id]})`).join(' · ')}</span>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">Take from</span>
              <select value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-fg-3">
                {engProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">Give to</span>
              <select value={to} onChange={(e) => setTo(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-fg-3">
                {engProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
                Engineers <span className="font-mono text-fg">{n}</span>
              </span>
              <input type="range" min={0} max={6} value={n} onChange={(e) => setN(parseInt(e.target.value, 10))} className="mt-2 w-full accent-[var(--color-amber)]" />
            </label>
            <button onClick={() => notify(`Scenario saved: move ${n} engineers ${sim ? `${sim.from.project.code} → ${sim.to.project.code}` : ''}. Added to the allocation decision.`, 'done')} className="btn btn-secondary w-full">
              Save scenario to the allocation decision
            </button>
          </div>
          {sim ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {[sim.to, sim.from].map((side, i) => (
                  <div key={side.project.id} className="rounded-lg border border-line bg-surface-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-sky)' }}>{i === 0 ? 'Receives' : 'Gives up'} {n}</span>
                      <span className="font-mono text-[10.5px]" style={{ color: 'var(--color-amber)' }}>{side.project.code}</span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-fg">{side.project.name}</div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-dim">Before</div>
                        <div className="mt-0.5 font-mono text-fg-2">{side.before.slipDays ? `+${side.before.slipDays}d · ${fmt(side.before.predictedGate)}` : `holds · ${fmt(side.before.gate)}`}</div>
                      </div>
                      <div>
                        <div className="text-dim">After</div>
                        <div className="mt-0.5 font-mono" style={{ color: side.slipAfter > side.before.slipDays ? 'var(--color-warn)' : side.slipAfter < side.before.slipDays ? 'var(--color-ok)' : 'var(--color-fg-2)' }}>
                          {side.slipAfter ? `+${side.slipAfter}d · ${fmt(side.gateAfter)}` : `holds · ${fmt(side.gateAfter)}`}
                          {i === 0 && sim.to.bufferDays > 0 ? ` (+${sim.to.bufferDays}d buffer)` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-line p-4">
                <span className="font-display text-[1.6rem] font-semibold leading-none" style={{ color: sim.net > 0 ? 'var(--color-amber)' : sim.net < 0 ? 'var(--color-bad)' : 'var(--color-fg-2)' }}>
                  {sim.net > 0 ? `+${sim.net}` : sim.net}
                </span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-sky)' }}>Net portfolio slip-days recovered</div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{sim.note} Ramp-up cost of roughly a week per move is already included.</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">Pick two different projects to simulate.</p>
          )}
        </div>
      </Card>

      {/* Resource forecast */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <Eyebrow>Resource forecast · next 8 weeks</Eyebrow>
          <span className="text-[11px] text-dim">Demand as % of capacity · surges around gates · line = 100%</span>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          {teams.map((t) => {
            const weeks = resourceForecast(t)
            const peak = Math.max(...weeks.map((w) => w.demand))
            return (
              <div key={t.id}>
                <div className="flex items-baseline justify-between">
                  <Link to={`/teams#${t.id}`} className="text-sm font-medium text-fg hover:underline">{t.name}</Link>
                  <span className="font-mono text-[11px]" style={{ color: peak > 100 ? 'var(--color-warn)' : 'var(--color-muted)' }}>peak {peak}%</span>
                </div>
                <div className="relative mt-3 flex h-[110px] items-end gap-1.5 border-b border-line">
                  <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line-strong" style={{ bottom: `${(100 / 125) * 100}%` }} />
                  {weeks.map((w) => (
                    <div key={w.week} className="group relative flex-1" style={{ height: `${Math.min(100, (w.demand / 125) * 100)}%` }}>
                      <div className="h-full rounded-t-sm" style={{ background: w.demand > 100 ? 'var(--color-warn)' : w.demand > 92 ? 'rgba(217,165,75,0.55)' : 'rgba(111,168,255,0.45)' }} />
                      {w.gates.length > 0 && <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[9px]" style={{ color: 'var(--color-amber)' }}>{w.gates.join('/')}</span>}
                      <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-fg group-hover:block">{w.demand}% · wk of {w.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[9.5px] text-dim">
                  <span>{weeks[0].label}</span>
                  <span>{weeks[7].label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        {/* Briefing generator */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>Briefing generator</Eyebrow>
            <div className="flex rounded-lg border border-line p-0.5">
              {(['board', 'leads', 'self'] as Audience[]).map((a) => (
                <button key={a} onClick={() => setAudience(a)} className={`rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${audience === a ? 'bg-invert text-on-invert' : 'text-[var(--color-muted)] hover:text-fg'}`}>
                  {a === 'self' ? 'For me' : a === 'leads' ? 'Team leads' : 'Board'}
                </button>
              ))}
            </div>
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-fg">{briefText.title}</h3>
          <div className="mt-3 space-y-3">
            {briefText.paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-fg-2">{p}</p>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <button
              onClick={() => {
                const text = `${briefText.title}\n\n${briefText.paragraphs.join('\n\n')}`
                navigator.clipboard?.writeText(text).catch(() => {})
                notify('Briefing copied to your clipboard.', 'done')
              }}
              className="btn btn-primary"
            >
              Copy briefing
            </button>
            <button onClick={() => notify(`Draft sent to ${audience === 'board' ? 'the board pre-read' : audience === 'leads' ? 'the three team leads' : 'your notes'}.`, 'done')} className="btn btn-secondary">
              Send draft
            </button>
          </div>
        </Card>

        {/* Questions to ask */}
        <Card className="p-6">
          <Eyebrow>Questions worth asking</Eyebrow>
          <ul className="mt-3 divide-y divide-line">
            {questions.map((q) => (
              <li key={q.q} className="flex items-start gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-fg">{q.q}</span>
                  <span className="block text-xs leading-snug text-[var(--color-muted)]">{q.why}</span>
                </span>
                <div className="flex shrink-0 gap-1.5">
                  <button onClick={() => setChat({ open: true, seed: q.q })} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-fg-2 hover:border-line-strong hover:text-fg">Ask</button>
                  <Link to={q.to} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-fg-2 hover:border-line-strong hover:text-fg">Open</Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <ChatModal open={chat.open} seed={chat.seed} onClose={() => setChat({ open: false })} />
    </div>
  )
}

function RowCells({ row }: { row: ReturnType<typeof riskMatrix>[number] }) {
  return (
    <>
      <Link to={`/projects/${row.project.id}`} className="flex items-center gap-2 bg-surface px-3 py-2.5 hover:bg-surface-2">
        <span className="font-mono text-[10px] font-semibold" style={{ color: 'var(--color-amber)' }}>{row.project.code}</span>
        <span className="truncate text-[12px] text-fg">{row.project.name}</span>
      </Link>
      {riskCategories.map((c) => (
        <div key={c} className="flex items-center justify-center bg-surface py-2.5" title={`${c}: ${['clear', 'watch', 'elevated', 'severe'][row.cells[c]]}`}>
          <span className="h-5 w-full max-w-[52px] rounded-sm border border-line" style={{ background: cellBg[row.cells[c]] }} />
        </div>
      ))}
      <div className="flex items-center justify-center bg-surface py-2.5 font-mono text-[11px] text-fg-2">{row.total}</div>
    </>
  )
}
