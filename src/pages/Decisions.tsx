import { useState } from 'react'
import { decisions, type Decision } from '../data'
import { Card, PriorityPill, SectionHeading } from '../components/ui'
import { BranchIcon, CalendarIcon, SparkleIcon, CheckIcon } from '../components/icons'
import { useToast } from '../components/Toast'

export default function Decisions() {
  const pending = decisions.length
  return (
    <div className="space-y-6">
      <SectionHeading title="Decisions" subtitle={`${pending} decisions need your input this week. AI has prepared options for each.`} />
      <div className="space-y-5">
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon width={22} height={22} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-bold text-ink-900">{decision.title}</h3>
              <PriorityPill priority={decision.priority} />
              {decided && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <CheckIcon width={13} height={13} /> Decided
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">{decision.summary}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-brand-50/60 p-3">
        <SparkleIcon width={16} height={16} className="mt-0.5 shrink-0 text-brand-500" />
        <p className="text-sm leading-relaxed text-slate-600">
          <span className="font-semibold text-slate-800">AI recommends:</span> {decision.recommendation}
        </p>
      </div>

      <fieldset className="mt-4 space-y-3" disabled={decided}>
        {decision.options.map((o, i) => {
          const active = selected === i
          return (
            <label
              key={i}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                active ? 'border-brand-400 bg-brand-50/50 ring-1 ring-brand-200' : 'border-slate-200 hover:border-slate-300'
              } ${decided ? 'cursor-default opacity-80' : ''}`}
            >
              <input
                type="radio"
                name={decision.id}
                checked={active}
                onChange={() => setSelected(i)}
                className="mt-1 h-4 w-4 accent-[var(--color-brand-600)]"
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink-900">{o.label}</span>
                  {o.recommended && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                      Recommended
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-slate-500">{o.detail}</span>
              </span>
            </label>
          )
        })}
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {decided ? (
          <button
            onClick={() => setDecided(false)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Reopen decision
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                setDecided(true)
                notify(`Decision recorded: “${decision.options[selected].label}”.`, 'done')
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              Confirm decision
            </button>
            <button
              onClick={() => notify(`Opening evidence for “${decision.title}”.`)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              {decision.secondaryCta}
            </button>
          </>
        )}
      </div>
    </Card>
  )
}
