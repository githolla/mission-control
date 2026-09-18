import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recommendations, type Recommendation } from '../data'
import { IconTile } from './ui'
import { useToast } from './Toast'
import {
  BranchIcon,
  CalendarIcon,
  UsersIcon,
  FileIcon,
  AlertIcon,
  LinkIcon,
  CheckIcon,
  SparkleIcon,
  ArrowRightIcon,
} from './icons'

const iconMap = {
  branch: BranchIcon,
  calendar: CalendarIcon,
  users: UsersIcon,
  file: FileIcon,
  alert: AlertIcon,
  link: LinkIcon,
}

type State = 'open' | 'accepted' | 'dismissed'

function ImpactTag({ impact }: { impact: Recommendation['impact'] }) {
  if (impact === 'high')
    return (
      <span className="rounded-full bg-invert px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-on-invert">
        High impact
      </span>
    )
  if (impact === 'medium')
    return (
      <span className="rounded-full border border-line-strong px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-3">
        Medium
      </span>
    )
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">Low</span>
  )
}

export default function Copilot() {
  const { notify } = useToast()
  const navigate = useNavigate()
  const [states, setStates] = useState<Record<string, State>>({})

  const stateOf = (id: string): State => states[id] ?? 'open'
  const set = (id: string, s: State) => setStates((prev) => ({ ...prev, [id]: s }))

  const openCount = useMemo(
    () => recommendations.filter((r) => stateOf(r.id) === 'open').length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [states],
  )
  const visible = recommendations.filter((r) => stateOf(r.id) !== 'dismissed')
  const allClear = visible.every((r) => stateOf(r.id) === 'accepted')

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-2 flex items-center gap-2">
            <SparkleIcon width={13} height={13} className="text-fg-3" />
            AI Copilot
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            {openCount > 0
              ? `${openCount} recommended ${openCount === 1 ? 'action' : 'actions'}, ranked by impact.`
              : 'You’re all caught up.'}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {allClear && (
          <div className="card flex items-center gap-3 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-invert text-on-invert">
              <CheckIcon width={18} height={18} />
            </span>
            <div>
              <div className="text-sm font-semibold text-fg">All caught up.</div>
              <p className="text-sm text-[var(--color-muted)]">
                Every recommendation is actioned. Ask the Copilot for more, or check back after the next sync.
              </p>
            </div>
          </div>
        )}

        {visible.map((r) => {
          const s = stateOf(r.id)
          const Icon = iconMap[r.icon]

          if (s === 'accepted') {
            return (
              <div key={r.id} className="card flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-invert text-on-invert">
                  <CheckIcon width={14} height={14} />
                </span>
                <span className="flex-1 text-sm text-fg-3 line-through decoration-[#3a3a3a]">{r.title}</span>
                <button
                  onClick={() => set(r.id, 'open')}
                  className="text-xs font-medium text-[var(--color-muted)] hover:text-fg"
                >
                  Undo
                </button>
              </div>
            )
          }

          return (
            <div key={r.id} className="card p-5">
              <div className="flex items-start gap-4">
                <IconTile className="h-10 w-10 shrink-0">
                  <Icon width={19} height={19} />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-fg">{r.title}</h3>
                    <ImpactTag impact={r.impact} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                      {r.category}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">{r.rationale}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        set(r.id, 'accepted')
                        notify(`${r.actionLabel === 'Approve' ? 'Approved' : 'Actioned'}: ${r.title}.`, 'done')
                      }}
                      className="btn btn-primary"
                    >
                      {r.actionLabel}
                    </button>
                    {r.to && (
                      <button onClick={() => navigate(r.to!)} className="btn btn-secondary">
                        View
                        <ArrowRightIcon width={15} height={15} />
                      </button>
                    )}
                    <button
                      onClick={() => set(r.id, 'dismissed')}
                      className="ml-auto text-xs font-medium text-[var(--color-muted)] hover:text-fg"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
