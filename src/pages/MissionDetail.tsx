import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { missions, teams, projectFor, type Status, type Mission } from '../data'
import { Card, StatusPill, IconTile } from '../components/ui'
import { ArrowRightIcon, AlertIcon, CheckIcon, UsersIcon, SparkleIcon } from '../components/icons'
import { useToast } from '../components/Toast'

// AI-suggested next steps: authored per mission when available, else derived
// from status. Each is a checkable action the owner can clear.
function stepsFor(m: Mission): string[] {
  if (m.nextSteps && m.nextSteps.length) return m.nextSteps
  if (m.status === 'at-risk' || m.status === 'blocked')
    return [
      'Clear the top blocker with the owner today.',
      'Confirm the mitigation and a firm new target date.',
      'Escalate to the director if it slips again.',
    ]
  return [
    'Confirm the next milestone owner and date.',
    'Check dependencies with adjacent teams.',
    'Post a short status to the console.',
  ]
}

function AiNextSteps({ mission }: { mission: Mission }) {
  const { notify } = useToast()
  const steps = stepsFor(mission)
  const [done, setDone] = useState<boolean[]>(() => steps.map(() => false))
  const cleared = done.filter(Boolean).length

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="eyebrow flex items-center gap-2">
          <SparkleIcon width={13} height={13} className="text-fg-3" />
          AI recommended next steps
        </div>
        <span className="text-xs tabular-nums text-[var(--color-muted)]">
          {cleared}/{steps.length} done
        </span>
      </div>
      <ul className="space-y-2">
        {steps.map((s, i) => (
          <li key={i}>
            <button
              onClick={() => {
                setDone((prev) => {
                  const next = [...prev]
                  next[i] = !next[i]
                  return next
                })
                if (!done[i]) notify('Step marked done.', 'done')
              }}
              className="group flex w-full items-start gap-3 rounded-lg border border-line p-3 text-left transition-colors hover:border-line-strong"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  done[i] ? 'border-transparent bg-invert text-on-invert' : 'border-line-strong text-transparent'
                }`}
              >
                <CheckIcon width={12} height={12} />
              </span>
              <span className={`text-sm ${done[i] ? 'text-[var(--color-muted)] line-through decoration-[#3a3a3a]' : 'text-fg-2'}`}>
                {s}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

const barColor: Record<Status, string> = {
  'on-track': 'bg-[var(--color-ok)]',
  'at-risk': 'bg-[var(--color-warn)]',
  blocked: 'bg-[var(--color-bad)]',
}

// Generic lifecycle milestones, derived from progress — no per-mission data needed.
const phases = [
  { label: 'Kickoff & scope', at: 15 },
  { label: 'Build & integrate', at: 45 },
  { label: 'Review & validate', at: 75 },
  { label: 'Ship & close out', at: 95 },
]

export default function MissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const mission = missions.find((m) => m.id === id)

  if (!mission) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted)]">That mission could not be found.</p>
        <Link to="/missions" className="btn btn-secondary w-fit">
          ← Back to missions
        </Link>
      </div>
    )
  }

  const team = teams.find((t) => t.name === mission.team)
  const project = projectFor(mission.id)
  const currentPhase = phases.findIndex((p) => mission.progress < p.at)

  return (
    <div className="space-y-7">
      {/* Breadcrumb / back */}
      <Link
        to="/missions"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-muted)] transition-colors hover:text-fg"
      >
        <span className="rotate-180">
          <ArrowRightIcon width={15} height={15} />
        </span>
        All missions
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">{mission.team} mission</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">{mission.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-[var(--color-muted)]">
            <StatusPill status={mission.status} />
            <span>Owner · {mission.owner}</span>
            <span>Due · {mission.due}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => notify(`Messaging ${mission.owner}.`)} className="btn btn-secondary">
            Message owner
          </button>
          <button onClick={() => notify(`“${mission.name}” added to your watchlist.`, 'done')} className="btn btn-primary">
            Watch mission
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* Overview */}
          <Card className="p-6">
            <div className="eyebrow mb-3">Overview</div>
            <p className="text-sm leading-relaxed text-fg-2">{mission.summary}</p>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--color-muted)]">
                <span>Progress</span>
                <span className="tabular-nums text-fg">{mission.progress}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div className={`h-full rounded-full ${barColor[mission.status]}`} style={{ width: `${mission.progress}%` }} />
              </div>
            </div>
          </Card>

          {/* AI recommended next steps */}
          <AiNextSteps key={mission.id} mission={mission} />

          {/* Milestones */}
          <Card className="p-6">
            <div className="eyebrow mb-4">Milestones</div>
            <ol className="space-y-3">
              {phases.map((p, i) => {
                const done = mission.progress >= p.at
                const active = i === currentPhase
                return (
                  <li key={p.label} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                        done
                          ? 'border-transparent bg-invert text-on-invert'
                          : active
                            ? 'border-fg text-fg'
                            : 'border-line text-dim'
                      }`}
                    >
                      {done ? <CheckIcon width={13} height={13} /> : i + 1}
                    </span>
                    <span className={`text-sm ${done ? 'text-fg' : active ? 'font-medium text-fg' : 'text-[var(--color-muted)]'}`}>
                      {p.label}
                    </span>
                    {active && (
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                        In progress
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          {/* At-risk callout → decisions */}
          {mission.status === 'at-risk' && (
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <IconTile className="h-9 w-9 shrink-0">
                  <AlertIcon width={17} height={17} />
                </IconTile>
                <div>
                  <div className="text-sm font-semibold text-fg">This mission is at risk</div>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    There is a related decision waiting for your input.
                  </p>
                  <Link
                    to="/decisions"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-fg hover:text-white"
                  >
                    Review decision
                    <ArrowRightIcon width={15} height={15} />
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Parent project */}
          {project && (
            <Card className="p-5">
              <div className="eyebrow mb-3">Part of project</div>
              <Link to={`/projects/${project.id}`} className="group flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line font-mono text-[11px] font-semibold text-fg-2">
                  {project.code}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-fg">{project.name}</div>
                  <div className="text-xs text-[var(--color-muted)]">
                    {project.kind === 'product' ? 'Product' : 'In testing'} · {project.stage}
                  </div>
                </div>
                <ArrowRightIcon width={16} height={16} className="text-dim transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Card>
          )}

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
                <ArrowRightIcon
                  width={16}
                  height={16}
                  className="text-dim transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </Card>
          )}

          {/* Key facts */}
          <Card className="divide-y divide-line p-0">
            {[
              { k: 'Status', v: mission.status === 'on-track' ? 'On track' : mission.status === 'at-risk' ? 'At risk' : 'Blocked' },
              { k: 'Owner', v: mission.owner },
              { k: 'Team', v: mission.team },
              { k: 'Due date', v: mission.due },
              { k: 'Completion', v: `${mission.progress}%` },
            ].map((row) => (
              <div key={row.k} className="flex items-center justify-between px-5 py-3">
                <span className="text-[12.5px] text-[var(--color-muted)]">{row.k}</span>
                <span className="text-sm font-medium text-fg">{row.v}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <button onClick={() => navigate('/missions')} className="btn btn-secondary">
          ← Back to all missions
        </button>
      </div>
    </div>
  )
}
