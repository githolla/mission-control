import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { teams, type Team } from '../data'
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
      el.classList.add('ring-1', 'ring-ink-900')
      const t = window.setTimeout(() => el.classList.remove('ring-1', 'ring-ink-900'), 1600)
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
const segTones = ['bg-ink-900', 'bg-ink-700', 'bg-slate-400', 'bg-slate-300']

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
              <h3 className="font-display text-lg font-semibold text-ink-900">{t.name}</h3>
              <StatusPill status={t.status} />
            </div>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-400">
              {t.lead} · {t.headcount} people · {t.missions} active missions
            </p>
          </div>
        </div>
        <button onClick={onMessage} className="btn btn-secondary">
          Message lead
        </button>
      </div>

      {/* Specialty */}
      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-ink-800">{t.specialty}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {t.disciplines.map((d) => (
          <span
            key={d}
            className="rounded-full border border-line bg-[#fafbfc] px-2.5 py-1 text-[11px] font-medium text-[var(--color-muted)]"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Metrics */}
      <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        {t.metrics.map((m) => (
          <div key={m.label} className="bg-white px-4 py-3.5">
            <div className="eyebrow">{m.label}</div>
            <div className="mt-1.5 font-display text-xl font-semibold tabular-nums text-ink-900">{m.value}</div>
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
              <span className="font-semibold text-ink-900">{r.allocated}</span> / {r.capacity} allocated
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-medium text-[var(--color-muted)]">
            <span className="uppercase tracking-[0.1em]">Utilization</span>
            <span className="tabular-nums text-ink-900">{r.utilization}%</span>
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
                <span className="flex-1 text-ink-800">{seg.label}</span>
                <span className="tabular-nums text-[var(--color-muted)]">{seg.value}%</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-[var(--color-muted)]">
            <span className="inline-flex h-5 items-center rounded-full border border-line-strong px-2 font-semibold text-ink-800">
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
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white">
                  <CheckIcon width={12} height={12} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="text-sm font-medium text-ink-900">{p.name}</span>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-slate-400">{p.period}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--color-muted)]">{p.outcome}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI insight */}
      <div className="mt-6 border-l-2 border-line pl-3">
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          <span className="font-semibold text-ink-700">AI insight</span> — {t.insight}
        </p>
      </div>
    </Card>
  )
}
