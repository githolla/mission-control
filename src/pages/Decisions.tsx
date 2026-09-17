import { useState } from 'react'
import { decisions, type Decision } from '../data'
import { Card, PriorityPill, SectionHeading, IconTile } from '../components/ui'
import { BranchIcon, CalendarIcon, CheckIcon } from '../components/icons'
import { useToast } from '../components/Toast'

export default function Decisions() {
  const pending = decisions.length
  return (
    <div className="space-y-7">
      <SectionHeading
        eyebrow="Decisions"
        title="Decisions for you"
        subtitle={`${pending} decisions need your input this week. AI has prepared options for each.`}
      />
      <div className="space-y-4">
        {decisions.map((d) => (
          <DecisionCard key={d.id} decision={d} />
        ))}
      </div>
    </div>
  )
}

function DecisionCard({ decision }: { decision: Decision }) {
  const { notify } = useToast()
  const recommendedIndex = decision.options.findIndex((o) => o.recommended)
  const [selected, setSelected] = useState<number>(recommendedIndex === -1 ? 0 : recommendedIndex)
  const [decided, setDecided] = useState(false)
  const Icon = decision.icon === 'branch' ? BranchIcon : CalendarIcon

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <IconTile className="h-11 w-11 shrink-0">
          <Icon width={21} height={21} />
        </IconTile>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-lg font-semibold text-ink-900">{decision.title}</h3>
            <PriorityPill priority={decision.priority} />
            {decided && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ok)]">
                <CheckIcon width={13} height={13} /> Decided
              </span>
            )}
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-800">{decision.summary}</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
            <span className="font-semibold text-ink-700">AI recommends</span> — {decision.recommendation}
          </p>
        </div>
      </div>

      <fieldset className="mt-5 space-y-2.5" disabled={decided}>
        {decision.options.map((o, i) => {
          const active = selected === i
          return (
            <label
              key={i}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                active ? 'border-ink-900 bg-[#fafbfc]' : 'border-line hover:border-line-strong'
              } ${decided ? 'cursor-default opacity-80' : ''}`}
            >
              <input
                type="radio"
                name={decision.id}
                checked={active}
                onChange={() => setSelected(i)}
                className="mt-0.5 h-4 w-4 accent-[var(--color-ink-900)]"
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink-900">{o.label}</span>
                  {o.recommended && (
                    <span className="rounded-full border border-line-strong px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      Recommended
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm text-[var(--color-muted)]">{o.detail}</span>
              </span>
            </label>
          )
        })}
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-5">
        {decided ? (
          <button onClick={() => setDecided(false)} className="btn btn-secondary">
            Reopen decision
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                setDecided(true)
                notify(`Decision recorded: “${decision.options[selected].label}”.`, 'done')
              }}
              className="btn btn-primary"
            >
              Confirm decision
            </button>
            <button onClick={() => notify(`Opening evidence for “${decision.title}”.`)} className="btn btn-secondary">
              {decision.secondaryCta}
            </button>
          </>
        )}
      </div>
    </Card>
  )
}
