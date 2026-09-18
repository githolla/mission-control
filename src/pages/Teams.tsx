import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { teams, projectsForTeam, type Team, type Status } from '../data'
import { Card, StatusPill, TeamIcon, SectionHeading, IconTile } from '../components/ui'
import { CheckIcon } from '../components/icons'
import { useToast } from '../components/Toast'

export default function Teams() {
  const { hash } = useLocation()
  const { notify } = useToast()

  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-1', 'ring-fg')
      const t = window.setTimeout(() => el.classList.remove('ring-1', 'ring-fg'), 1600)
      return () => window.clearTimeout(t)
    }
  }, [hash])

  return (
    <div className="space-y-7">
      <SectionHeading
        eyebrow="Teams"
        title="Team command"
        subtitle="Three teams roll up into Command. Each lead owns their missions, resourcing and risks."
      />
      <div className="space-y-4">
        {teams.map((t) => (
          <TeamCard key={t.id} team={t} onMessage={() => notify(`Messaging ${t.lead}, ${t.name} lead.`)} />
        ))}
      </div>
    </div>
  )
}

// Muted, monochrome-friendly segments for the allocation bar.
const segTones = ['bg-invert', 'bg-fg-3', 'bg-[#5a5a5a]', 'bg-[#3a3a3a]']

// Small status dot hues for the crew roster.
const dotHue: Record<Status, string> = {
  'on-track': 'var(--color-ok)',
  'at-risk': 'var(--color-warn)',
  blocked: 'var(--color-bad)',
}

function TeamCard({ team: t, onMessage }: { team: Team; onMessage: () => void }) {
  const r = t.resourcing
  return (
    <Card id={t.id} className="scroll-mt-24 p-6 transition-shadow">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <IconTile className="h-11 w-11">
            <TeamIcon name={t.icon} width={21} height={21} />
          </IconTile>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-display text-lg font-semibold text-fg">{t.name}</h3>
              <StatusPill status={t.status} />
            </div>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-dim">
              {t.lead} · {t.headcount} people · {t.missions} active missions
            </p>
          </div>
        </div>
        <button onClick={onMessage} className="btn btn-secondary">
          Message lead
        </button>
      </div>

      {/* Specialty */}
      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-fg-2">{t.specialty}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {t.disciplines.map((d) => (
          <span
            key={d}
            className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-[var(--color-muted)]"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Projects owned */}
      {projectsForTeam(t.name).length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">Projects</span>
          {projectsForTeam(t.name).map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="group inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 transition-colors hover:border-line-strong"
            >
              <span className="font-mono text-[11px] font-semibold text-fg-2">{p.code}</span>
              <span className="text-[12px] font-medium text-fg">{p.name}</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    p.status === 'on-track'
                      ? 'var(--color-ok)'
                      : p.status === 'at-risk'
                        ? 'var(--color-warn)'
                        : 'var(--color-bad)',
                }}
              />
            </Link>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        {t.metrics.map((m) => (
          <div key={m.label} className="bg-surface px-4 py-3.5">
            <div className="eyebrow">{m.label}</div>
            <div className="mt-1.5 font-mono text-xl font-medium text-fg">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Resourcing + Past projects */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Resourcing */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="eyebrow">Resourcing</div>
            <div className="text-xs text-[var(--color-muted)]">
              <span className="font-semibold text-fg">{r.allocated}</span> / {r.capacity} allocated
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-medium text-[var(--color-muted)]">
            <span className="uppercase tracking-[0.1em]">Utilization</span>
            <span className="font-mono text-fg">{r.utilization}%</span>
          </div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-line">
            {r.allocation.map((seg, i) => (
              <div
                key={seg.label}
                className={segTones[i % segTones.length]}
                style={{ width: `${seg.value}%` }}
                title={`${seg.label} · ${seg.value}%`}
              />
            ))}
          </div>

          <ul className="mt-4 space-y-2">
            {r.allocation.map((seg, i) => (
              <li key={seg.label} className="flex items-center gap-2.5 text-sm">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${segTones[i % segTones.length]}`} />
                <span className="flex-1 text-fg-2">{seg.label}</span>
                <span className="tabular-nums text-[var(--color-muted)]">{seg.value}%</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-[var(--color-muted)]">
            <span className="inline-flex h-5 items-center rounded-full border border-line-strong px-2 font-semibold text-fg-2">
              {r.openRoles}
            </span>
            open {r.openRoles === 1 ? 'role' : 'roles'} in hiring
          </div>
        </div>

        {/* Past projects */}
        <div>
          <div className="eyebrow mb-3">Past projects</div>
          <ul className="space-y-3">
            {t.pastProjects.map((p) => (
              <li key={p.name} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-invert text-on-invert">
                  <CheckIcon width={12} height={12} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="text-sm font-medium text-fg">{p.name}</span>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-dim">{p.period}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--color-muted)]">{p.outcome}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Crew */}
      <div className="mt-6 border-t border-line pt-6">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-2">
          <div className="eyebrow">Crew</div>
          <span className="text-xs text-[var(--color-muted)]">
            · {t.members.length} shown · {t.headcount} people
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {t.members.map((m) => (
            <div key={m.name} className="flex items-start gap-3 rounded-lg border border-line p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-invert text-[11px] font-semibold text-on-invert">
                {m.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-fg">{m.name}</span>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: dotHue[m.status] }}
                    title={m.status === 'on-track' ? 'On track' : m.status === 'at-risk' ? 'At risk' : 'Blocked'}
                  />
                </div>
                <div className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-dim">
                  {m.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{m.focus}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI insight */}
      <div className="mt-6 border-l-2 border-line pl-3">
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          <span className="font-semibold text-fg-3">AI insight</span> — {t.insight}
        </p>
      </div>
    </Card>
  )
}
