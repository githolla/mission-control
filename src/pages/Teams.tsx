import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { teams } from '../data'
import { Card, StatusPill, TeamIcon, SectionHeading, IconTile } from '../components/ui'
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
        subtitle="Three teams roll up into Command. Each lead owns their missions and risks."
      />

      <div className="space-y-4">
        {teams.map((t) => (
          <Card key={t.id} id={t.id} className="scroll-mt-24 p-6 transition-shadow">
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
              <button onClick={() => notify(`Messaging ${t.lead}, ${t.name} lead.`)} className="btn btn-secondary">
                Message lead
              </button>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-800">{t.summary}</p>

            <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
              {t.metrics.map((m) => (
                <div key={m.label} className="bg-white px-4 py-3.5">
                  <div className="eyebrow">{m.label}</div>
                  <div className="mt-1.5 font-display text-xl font-semibold tabular-nums text-ink-900">{m.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 border-l-2 border-line pl-3">
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                <span className="font-semibold text-ink-700">AI insight</span> — {t.insight}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
