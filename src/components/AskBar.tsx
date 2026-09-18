import { useState } from 'react'
import { SparkleIcon, SendIcon } from './icons'
import { suggestedPrompts } from '../data'
import { answerFor } from '../lib/assistant'

type Turn = { q: string; a: string }

export default function AskBar() {
  const [value, setValue] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])

  function submit(q: string) {
    const query = q.trim()
    if (!query) return
    setTurns((prev) => [...prev, { q: query, a: answerFor(query) }].slice(-4))
    setValue('')
  }

  return (
    <div className="space-y-3">
      {turns.length > 0 && (
        <div className="space-y-3">
          {turns.map((turn, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-end">
                <p className="max-w-[80%] rounded-xl rounded-br-sm bg-invert px-4 py-2.5 text-sm text-on-invert">
                  {turn.q}
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-fg-3">
                  <SparkleIcon width={16} height={16} />
                </span>
                <p className="max-w-[80%] rounded-xl rounded-tl-sm border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-fg-2">
                  {turn.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(value)
        }}
        className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 transition-colors focus-within:border-fg-3"
      >
        <SparkleIcon className="shrink-0 text-fg-3" width={19} height={19} />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask Mission Control anything..."
          className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-dim"
        />
        <button
          type="submit"
          aria-label="Send"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-dim transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <SendIcon width={18} height={18} />
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {suggestedPrompts.map((p) => (
          <button
            key={p}
            onClick={() => submit(p)}
            className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-line-strong hover:text-fg"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
