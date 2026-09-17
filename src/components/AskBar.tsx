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
                <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
                  {turn.q}
                </p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <SparkleIcon width={17} height={17} />
                </span>
                <p className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-relaxed text-ink-800 ring-1 ring-slate-200">
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
        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-brand-500/40"
      >
        <SparkleIcon className="shrink-0 text-brand-600" width={20} height={20} />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask Mission Control anything..."
          className="flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          aria-label="Send"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600"
        >
          <SendIcon width={18} height={18} />
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {suggestedPrompts.map((p) => (
          <button
            key={p}
            onClick={() => submit(p)}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
