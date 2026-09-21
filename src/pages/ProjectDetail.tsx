import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { projects, teams, missionsForProject, type Status } from '../data'
import { Card, StatusPill, IconTile } from '../components/ui'
import { ArrowRightIcon, SparkleIcon, UsersIcon, RocketIcon } from '../components/icons'
import { useToast } from '../components/Toast'
import ChatModal from '../components/ChatModal'
import { forecastProject, riskMatrix, riskCategories, fmt } from '../lib/intel'
import { egoGraph, type GraphNode } from '../lib/graph'
import Graph, { NodePanel } from '../components/Graph'

const barColor: Record<Status, string> = {
  'on-track': 'bg-[var(--color-ok)]',
  'at-risk': 'bg-[var(--color-warn)]',
  blocked: 'bg-[var(--color-bad)]',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [chat, setChat] = useState<{ open: boolean; seed?: string }>({ open: false })
  const [picked, setPicked] = useState<GraphNode | null>(null)
  const ego = useMemo(() => (id ? egoGraph(id, 2) : { nodes: [], links: [] }), [id])
  const project = projects.find((p) => p.id === id)

  if (!project) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted)]">That project could not be found.</p>
        <Link to="/projects" className="btn btn-secondary w-fit">
          ← Back to projects
        </Link>
      </div>
    )
  }

  const team = teams.find((t) => t.name === project.team)
  const rollupMissions = missionsForProject(project)
  const f = forecastProject(project)
  const risks = riskMatrix().find((r) => r.project.id === project.id)
  const prompts = [
    `Forecast for ${project.code}`,
    `Why is ${project.code} at risk?`,
    `What is happening on ${project.code}?`,
    `Who leads ${project.code}?`,
  ]

  return (
    <div className="space-y-7">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-muted)] transition-colors hover:text-fg"
      >
        <span className="rotate-180">
          <ArrowRightIcon width={15} height={15} />
        </span>
        All projects
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-line font-mono text-base font-semibold text-fg-2">
            {project.code}
          </span>
          <div>
            <div className="eyebrow mb-1.5">
              {project.kind === 'product' ? 'Product' : 'Exploration'} · {project.stage}
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">{project.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase tracking-[0.08em] text-dim">
              <StatusPill status={project.status} />
              <span>{project.team} · {project.lead}</span>
              <span className="font-mono normal-case tracking-normal text-[var(--color-muted)]">Gate · {project.gate}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => notify(`Shared the ${project.name} status.`)} className="btn btn-secondary">
            Share status
          </button>
          <button onClick={() => notify(`Watching ${project.name}.`, 'done')} className="btn btn-primary">
            Watch project
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* Overview + metrics */}
          <Card className="p-6">
            <div className="eyebrow mb-3">Overview</div>
            <p className="text-sm leading-relaxed text-fg-2">{project.summary}</p>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--color-muted)]">
                <span className="uppercase tracking-[0.1em]">Progress</span>
                <span className="font-mono text-fg">{project.progress}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div className={`h-full rounded-full ${barColor[project.status]}`} style={{ width: `${project.progress}%` }} />
              </div>
            </div>

            <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
              {project.metrics.map((m) => (
                <div key={m.label} className="bg-surface px-4 py-3.5">
                  <div className="eyebrow">{m.label}</div>
                  <div className="mt-1.5 font-mono text-xl font-medium text-fg">{m.value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI analysis */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="eyebrow flex items-center gap-2">
                <SparkleIcon width={13} height={13} className="text-fg-3" />
                AI analysis
              </div>
              <Link to="/analysis" className="text-xs font-medium text-[var(--color-muted)] hover:text-fg">Full analysis →</Link>
            </div>
            <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
              {[
                { k: 'Forecast', v: f.slipDays ? `+${f.slipDays} days` : 'Holds gate', d: f.slipDays ? `Lands ${fmt(f.predictedGate)} unmitigated` : `${project.gate} · T-${f.daysToGate}`, warn: f.slipDays > 0 },
                { k: 'Plan line', v: `${project.progress}% / ${f.expected}%`, d: `Actual vs expected · ${f.trend}` },
                { k: 'SPI', v: f.spi.toFixed(2), d: f.spi >= 1 ? 'Ahead of schedule' : 'Behind schedule' },
                { k: 'Risk score', v: `${f.riskScore}`, d: `${f.confidence} confidence`, warn: f.riskScore >= 50 },
              ].map((c) => (
                <div key={c.k} className="bg-surface px-4 py-3.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-sky)' }}>{c.k}</div>
                  <div className="mt-1.5 font-display text-xl font-semibold tracking-tight" style={{ color: c.warn ? 'var(--color-warn)' : 'var(--color-amber)' }}>{c.v}</div>
                  <div className="mt-1 text-[11px] text-[var(--color-muted)]">{c.d}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">Risk drivers</div>
                <ul className="mt-2 space-y-1.5">
                  {f.drivers.map((d) => (
                    <li key={d} className="flex gap-2 text-[12.5px] leading-snug text-fg-2">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--color-warn)]" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">Risk profile</div>
                <ul className="mt-2 space-y-1.5">
                  {risks &&
                    riskCategories.map((c) => (
                      <li key={c} className="flex items-center gap-3 text-[12.5px]">
                        <span className="w-24 text-[var(--color-muted)]">{c}</span>
                        <span className="flex gap-1">
                          {[1, 2, 3].map((i) => (
                            <span key={i} className="h-2 w-6 rounded-sm border border-line" style={{ background: i <= risks.cells[c] ? (risks.cells[c] >= 3 ? 'var(--color-bad)' : risks.cells[c] === 2 ? 'var(--color-warn)' : 'var(--color-accent)') : 'transparent' }} />
                          ))}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.08em] text-dim">{['clear', 'watch', 'elevated', 'severe'][risks.cells[c]]}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
              {prompts.map((q) => (
                <button key={q} onClick={() => setChat({ open: true, seed: q })} className="rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-line-strong hover:text-fg">
                  {q}
                </button>
              ))}
            </div>
          </Card>

          {/* Network — everything this project touches */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between px-6 pt-5">
              <div className="eyebrow flex items-center gap-2">
                <SparkleIcon width={13} height={13} className="text-fg-3" />
                Project network
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10.5px] text-dim">{ego.nodes.length} nodes · {ego.links.length} links</span>
                <Link to="/control-room" className="text-xs font-medium text-[var(--color-muted)] hover:text-fg">Whole company →</Link>
              </div>
            </div>
            <div className="mt-3 grid lg:grid-cols-[1fr_260px]">
              <div className="relative">
                <div className="stars absolute inset-0 opacity-30" />
                <Graph nodes={ego.nodes} links={ego.links} height={440} ring={false} rootId={project.id} selectedId={picked?.id ?? project.id} onSelect={setPicked} className="relative" />
              </div>
              <div className="flex h-[440px] flex-col overflow-hidden border-l border-line p-4">
                <NodePanel node={picked ?? ego.nodes.find((n) => n.id === project.id)!} nodes={ego.nodes} links={ego.links} onSelect={setPicked} onAsk={(q) => setChat({ open: true, seed: q })} />
              </div>
            </div>
          </Card>

          {/* Missions rolling up */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="eyebrow">Missions rolling up</div>
              <span className="font-mono text-xs text-dim">{rollupMissions.length}</span>
            </div>
            {rollupMissions.length ? (
              <ul className="divide-y divide-line">
                {rollupMissions.map((m) => (
                  <li key={m.id}>
                    <Link to={`/missions/${m.id}`} className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface-2">
                      <IconTile className="h-8 w-8 shrink-0">
                        <RocketIcon width={15} height={15} />
                      </IconTile>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{m.name}</span>
                        <span className="block truncate text-xs text-[var(--color-muted)]">
                          {m.owner} · Due {m.due}
                        </span>
                      </span>
                      <span className="font-mono text-xs text-[var(--color-muted)]">{m.progress}%</span>
                      <StatusPill status={m.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                No missions yet — this exploration is pre-mission. Its next gate is {project.gate}.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* AI insight */}
          <Card className="p-5">
            <div className="eyebrow mb-3 flex items-center gap-2">
              <SparkleIcon width={13} height={13} className="text-fg-3" />
              AI insight
            </div>
            <p className="text-sm leading-relaxed text-fg-2">{project.insight}</p>
          </Card>

          {/* Owning team */}
          {team && (
            <Card className="p-5">
              <div className="eyebrow mb-3">Owning team</div>
              <Link to={`/teams#${team.id}`} className="group flex items-center gap-3">
                <IconTile className="h-9 w-9">
                  <UsersIcon width={17} height={17} />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-fg">{team.name}</div>
                  <div className="text-xs text-[var(--color-muted)]">Lead · {team.lead}</div>
                </div>
                <ArrowRightIcon width={16} height={16} className="text-dim transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Card>
          )}

          {/* Key facts */}
          <Card className="divide-y divide-line p-0">
            {[
              { k: 'Type', v: project.kind === 'product' ? 'Product' : 'Exploration' },
              { k: 'Stage', v: project.stage },
              { k: 'Lead', v: project.lead },
              { k: 'Next gate', v: project.gate },
              { k: 'Progress', v: `${project.progress}%` },
            ].map((row) => (
              <div key={row.k} className="flex items-center justify-between px-5 py-3">
                <span className="text-xs uppercase tracking-[0.1em] text-dim">{row.k}</span>
                <span className="text-sm font-medium text-fg">{row.v}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <button onClick={() => navigate('/projects')} className="btn btn-secondary">
          ← Back to all projects
        </button>
      </div>

      <ChatModal open={chat.open} seed={chat.seed} onClose={() => setChat({ open: false })} />
    </div>
  )
}
