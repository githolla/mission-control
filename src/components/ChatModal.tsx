import { useEffect, useRef, useState } from 'react'
import { SparkleIcon, SendIcon } from './icons'
import { answerFor, todayIntro } from '../lib/assistant'
import { suggestedPrompts } from '../data'

type Msg = { role: 'user' | 'ai'; text: string }

export default function ChatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'ai', text: todayIntro }])
  const [value, setValue] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])

  // Close on Escape; focus the input when opened.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, onClose])

  // Auto-scroll to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  // Clean up any pending timers on unmount.
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  if (!open) return null

  function send(text: string) {
    const q = text.trim()
    if (!q || typing) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setValue('')
    setTyping(true)
    const t = window.setTimeout(() => {
      setTyping(false)
      setMessages((m) => [...m, { role: 'ai', text: answerFor(q) }])
    }, 750)
    timers.current.push(t)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]" onClick={onClose} />

      <div className="relative flex h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-[sheetIn_.24s_ease-out] sm:h-[640px] sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-ink-950 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-amber-300">
              <SparkleIcon width={19} height={19} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Ask Mission Control</div>
              <div className="text-xs text-slate-400">About today · Thursday, September 17</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* Thread */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 px-5 py-5">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[82%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm text-white">{m.text}</p>
              </div>
            ) : (
              <div key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <SparkleIcon width={17} height={17} />
                </span>
                <p className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-relaxed text-ink-800 ring-1 ring-slate-200">
                  {m.text}
                </p>
              </div>
            ),
          )}

          {typing && (
            <div className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <SparkleIcon width={17} height={17} />
              </span>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3.5 ring-1 ring-slate-200">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-slate-200 bg-white px-5 py-4">
          {messages.length <= 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(value)
            }}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 focus-within:ring-2 focus-within:ring-brand-500/40"
          >
            <SparkleIcon className="shrink-0 text-brand-600" width={19} height={19} />
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask about today..."
              className="flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              aria-label="Send"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600"
            >
              <SendIcon width={18} height={18} />
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes sheetIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  )
}
