import { Card } from './ui'
import { upcomingGates, flightReadiness, today, type Readiness } from '../data'

/**
 * Mission clock — a slim, technical T-minus readout to the nearest upcoming
 * gate, with the next one or two gates trailing behind it. Monochrome, tabular.
 */
export function MissionClock() {
  const gates = upcomingGates()
  if (gates.length === 0) return null
  const [next, ...rest] = gates

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-line bg-white px-5 py-4">
      <div className="flex items-center gap-4">
        <span className="eyebrow">Next gate</span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-medium tracking-tight text-ink-900">T&#8209;{next.tMinus}</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            {next.tMinus === 1 ? 'day' : 'days'}
          </span>
          <span className="ml-2 text-sm font-medium uppercase tracking-[0.1em] text-ink-800">{next.label}</span>
        </div>
      </div>

      {rest.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:ml-auto sm:border-l sm:border-line sm:pl-8">
          {rest.slice(0, 2).map((g) => (
            <div key={g.id} className="flex items-baseline gap-2 text-xs">
              <span className="font-mono font-medium text-ink-700">T&#8209;{g.tMinus}</span>
              <span className="uppercase tracking-[0.1em] text-[var(--color-muted)]">{g.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const readinessMeta: Record<Readiness, { label: string; hue: string }> = {
  go: { label: 'GO', hue: 'var(--color-ok)' },
  watch: { label: 'WATCH', hue: 'var(--color-warn)' },
  'no-go': { label: 'NO-GO', hue: 'var(--color-bad)' },
}

/**
 * Flight readiness — a Go / No-Go poll of every domain, rolled up to the
 * flight director's console. Small hue dots + tabular GO/WATCH/NO-GO tags.
 */
export function ReadinessBoard() {
  const items = flightReadiness
  const noGo = items.filter((i) => i.status === 'no-go').length
  const allGo = items.every((i) => i.status === 'go')

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <div className="eyebrow">Flight readiness</div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Go / No-Go poll — all stations, {today.briefUpdated}.
          </p>
        </div>
        <span
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: allGo ? 'var(--color-ok)' : 'var(--color-bad)' }}
        >
          {allGo ? 'ALL GO' : `${noGo} NO-GO`}
        </span>
      </div>

      <ul className="divide-y divide-line">
        {items.map((i) => {
          const m = readinessMeta[i.status]
          return (
            <li key={i.domain} className="flex items-center gap-4 px-5 py-3.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: m.hue }} />
              <span className="w-24 shrink-0 text-sm font-medium text-ink-900">{i.domain}</span>
              <span
                className="w-16 shrink-0 font-mono text-[12px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: m.hue }}
              >
                {m.label}
              </span>
              <span className="hidden flex-1 truncate text-sm text-[var(--color-muted)] sm:block">{i.note}</span>
            </li>
          )
        })}
      </ul>

      <div className="border-t border-line px-5 py-3.5 text-xs leading-relaxed text-[var(--color-muted)]">
        <span className="font-semibold text-ink-700">Flight director&rsquo;s call</span> — one NO-GO open. Approve the
        recovery plan to clear the board.
      </div>
    </Card>
  )
}
