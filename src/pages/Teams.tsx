import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { teams } from '../data'
import { Card, StatusPill, TeamIcon, SectionHeading } from '../components/ui'
import { SparkleIcon } from '../components/icons'
import { useToast } from '../components/Toast'

export default function Teams() {
  const { hash } = useLocation()
  const { notify } = useToast()

  // Scroll to (and highlight) a team when linked with #id from the Overview.
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-brand-400')
      const t = window.setTimeout(() => el.classList.remove('ring-2', 'ring-brand-400'), 1600)
      return () => window.clearTimeout(t)
    }
  }, [hash])

  return (
    <div className="space-y-6">
      <SectionHeading title="Teams" subtitle="Three teams roll up into Command. Each lead owns their missions and risks." />

      <div className="space-y-5">
        {teams.map((t) => (
          <Card key={t.id} id={t.id} className="scroll-mt-24 p-6 transition-shadow">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <TeamIcon name={t.icon} width={24} height={24} />
                </span>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-xl font-bold text-ink-900">{t.name}</h3>
                    <StatusPill status={t.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Lead <span className="font-medium text-slate-700">{t.lead}</span> · {t.headcount} people ·{' '}
                    {t.missions} active missions
                  </p>
                </div>
              </div>
              <button
                onClick={() => notify(`Messaging ${t.lead}, ${t.name} lead.`)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Message lead
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">{t.summary}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {t.metrics.map((m) => (
                <div key={m.label} className="rounded-xl bg-slate-50 px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{m.label}</div>
                  <div className="mt-1 font-display text-xl font-bold text-ink-900">{m.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-brand-50/60 p-3">
              <SparkleIcon width={16} height={16} className="mt-0.5 shrink-0 text-brand-500" />
              <p className="text-sm leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-800">AI insight:</span> {t.insight}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
