import { useMemo, useState } from 'react'
import { missions, type Status } from '../data'
import { Card, StatusPill, SectionHeading } from '../components/ui'
import { useToast } from '../components/Toast'

type Filter = 'all' | Status

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'on-track', label: 'On track' },
  { id: 'at-risk', label: 'At risk' },
]

const barColor: Record<Status, string> = {
  'on-track': 'bg-[var(--color-ok)]',
  'at-risk': 'bg-[var(--color-warn)]',
  blocked: 'bg-[var(--color-bad)]',
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
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Missions"
          title="Active missions"
          subtitle={`${onTrack} of ${missions.length} missions on track this quarter.`}
        />
        <div className="flex gap-1 rounded-lg border border-line bg-white p-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === f.id ? 'bg-ink-900 text-white' : 'text-[var(--color-muted)] hover:text-ink-900'
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
                <h3 className="font-display text-base font-semibold text-ink-900">{m.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-400">
                  {m.team} · {m.owner} · Due {m.due}
                </p>
              </div>
              <StatusPill status={m.status} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-800">{m.summary}</p>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--color-muted)]">
                <span className="uppercase tracking-[0.1em]">Progress</span>
                <span className="tabular-nums text-ink-900">{m.progress}%</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                <div className={`h-full rounded-full ${barColor[m.status]}`} style={{ width: `${m.progress}%` }} />
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-line pt-4">
              <button
                onClick={() => notify(`Opening the “${m.name}” mission workspace.`)}
                className="text-sm font-medium text-ink-900 hover:text-black"
              >
                Open mission →
              </button>
            </div>
          </Card>
        ))}
      </div>

      {list.length === 0 && (
        <Card className="p-10 text-center text-sm text-[var(--color-muted)]">No missions match this filter.</Card>
      )}
    </div>
  )
}
