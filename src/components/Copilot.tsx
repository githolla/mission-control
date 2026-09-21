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
      <span className="rounded-md bg-[rgba(242,169,59,0.14)] px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--color-amber)]">
        High impact
      </span>
    )
  if (impact === 'medium')
    return (
      <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10.5px] font-semibold text-fg-3">
        Medium
      </span>
    )
  return (
    <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--color-muted)]">Low</span>
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

      <div className="grid gap-2.5">
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
            <div key={r.id} className="card flex items-start gap-4 px-5 py-4">
              <IconTile className="mt-0.5 h-9 w-9 shrink-0 border-0 bg-white/[0.05]">
                <Icon width={17} height={17} />
              </IconTile>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[14.5px] font-semibold text-fg">{r.title}</h3>
                  <ImpactTag impact={r.impact} />
                  <span className="text-[11.5px] text-dim">{r.category}</span>
                </div>
                <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[var(--color-muted)]">{r.rationale}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => {
                    set(r.id, 'accepted')
                    notify(`${r.actionLabel === 'Approve' ? 'Approved' : 'Actioned'}: ${r.title}.`, 'done')
                  }}
                  className="btn btn-primary !py-2"
                >
                  {r.actionLabel}
                </button>
                {r.to && (
                  <button onClick={() => navigate(r.to!)} className="btn btn-secondary !py-2">
                    View
                    <ArrowRightIcon width={15} height={15} />
                  </button>
                )}
                <button onClick={() => set(r.id, 'dismissed')} className="px-2 text-xs font-medium text-[var(--color-muted)] hover:text-fg">
                  Dismiss
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
