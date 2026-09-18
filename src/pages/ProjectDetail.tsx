import { Link, useNavigate, useParams } from 'react-router-dom'
import { projects, teams, missionsForProject, type Status } from '../data'
import { Card, StatusPill, IconTile } from '../components/ui'
import { ArrowRightIcon, SparkleIcon, UsersIcon, RocketIcon } from '../components/icons'
import { useToast } from '../components/Toast'

const barColor: Record<Status, string> = {
  'on-track': 'bg-[var(--color-ok)]',
  'at-risk': 'bg-[var(--color-warn)]',
  blocked: 'bg-[var(--color-bad)]',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
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

  return (
    <div className="space-y-7">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-muted)] transition-colors hover:text-ink-900"
      >
        <span className="rotate-180">
          <ArrowRightIcon width={15} height={15} />
        </span>
        All projects
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-line font-mono text-base font-semibold text-ink-800">
            {project.code}
          </span>
          <div>
            <div className="eyebrow mb-1.5">
              {project.kind === 'product' ? 'Product' : 'Exploration'} · {project.stage}
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">{project.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase tracking-[0.08em] text-slate-400">
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
            <p className="text-sm leading-relaxed text-ink-800">{project.summary}</p>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--color-muted)]">
                <span className="uppercase tracking-[0.1em]">Progress</span>
                <span className="font-mono text-ink-900">{project.progress}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div className={`h-full rounded-full ${barColor[project.status]}`} style={{ width: `${project.progress}%` }} />
              </div>
            </div>

            <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
              {project.metrics.map((m) => (
                <div key={m.label} className="bg-white px-4 py-3.5">
                  <div className="eyebrow">{m.label}</div>
                  <div className="mt-1.5 font-mono text-xl font-medium text-ink-900">{m.value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Missions rolling up */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="eyebrow">Missions rolling up</div>
              <span className="font-mono text-xs text-slate-400">{rollupMissions.length}</span>
            </div>
            {rollupMissions.length ? (
              <ul className="divide-y divide-line">
                {rollupMissions.map((m) => (
                  <li key={m.id}>
                    <Link to={`/missions/${m.id}`} className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-[#f7f8fa]">
                      <IconTile className="h-8 w-8 shrink-0">
                        <RocketIcon width={15} height={15} />
                      </IconTile>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink-900">{m.name}</span>
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
              <SparkleIcon width={13} height={13} className="text-ink-700" />
              AI insight
            </div>
            <p className="text-sm leading-relaxed text-ink-800">{project.insight}</p>
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
                  <div className="text-sm font-semibold text-ink-900">{team.name}</div>
                  <div className="text-xs text-[var(--color-muted)]">Lead · {team.lead}</div>
                </div>
                <ArrowRightIcon width={16} height={16} className="text-slate-400 transition-transform group-hover:translate-x-0.5" />
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
                <span className="text-xs uppercase tracking-[0.1em] text-slate-400">{row.k}</span>
                <span className="text-sm font-medium text-ink-900">{row.v}</span>
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
    </div>
  )
}
