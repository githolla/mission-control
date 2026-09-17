import { useMemo, useState } from 'react'
import { missions, type Status } from '../data'
import { Card, StatusPill, SectionHeading } from '../components/ui'
import { useToast } from '../components/Toast'

type Filter = 'all' | Status

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All missions' },
  { id: 'on-track', label: 'On track' },
  { id: 'at-risk', label: 'At risk' },
]

const barColor: Record<Status, string> = {
  'on-track': 'bg-emerald-500',
  'at-risk': 'bg-amber-500',
  blocked: 'bg-rose-500',
}

export default function Missions() {
  const { notify } = useToast()
  const [filter, setFilter] = useState<Filter>('all')

  const list = useMemo(
    () => (filter === 'all' ? missions : missions.filter((m) => m.status === filter)),
    [filter],
  )
  const onTrack = missions.filter((m) => m.status === 'on-track').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title="Missions" subtitle={`${onTrack} of ${missions.length} missions on track this quarter.`} />
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.id ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((m) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-ink-900">{m.name}</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  {m.team} · Owner {m.owner} · Due {m.due}
                </p>
              </div>
              <StatusPill status={m.status} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{m.summary}</p>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Progress</span>
                <span>{m.progress}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${barColor[m.status]}`} style={{ width: `${m.progress}%` }} />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => notify(`Opening the “${m.name}” mission workspace.`)}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Open mission →
              </button>
            </div>
          </Card>
        ))}
      </div>

      {list.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-500">No missions match this filter.</Card>
      )}
    </div>
  )
}
