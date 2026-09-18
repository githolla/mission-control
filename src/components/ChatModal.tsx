import { useEffect, useRef, useState } from 'react'
import { SparkleIcon, SendIcon } from './icons'
import { answerFor, todayIntro } from '../lib/assistant'
import { suggestedPrompts } from '../data'

type Msg = { role: 'user' | 'ai'; text: string }

export default function ChatModal({ open, onClose, seed }: { open: boolean; onClose: () => void; seed?: string }) {
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

  // A seeded question (from a project page or the analysis page) is asked on open.
  const seeded = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!open || !seed || seeded.current === seed) return
    seeded.current = seed
    const q = seed
    setMessages((m) => [...m, { role: 'user', text: q }])
    setTyping(true)
    const t = window.setTimeout(() => {
      setTyping(false)
      setMessages((m) => [...m, { role: 'ai', text: answerFor(q) }])
    }, 750)
    timers.current.push(t)
  }, [open, seed])

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

      <div className="relative flex h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl animate-[sheetIn_.24s_ease-out] sm:h-[640px] sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-ink-950 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
              <SparkleIcon width={19} height={19} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Ask Mission Control</div>
              <div className="text-xs text-dim">About today · Thursday, September 17</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-3 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* Thread */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-surface-2 px-5 py-5">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[82%] rounded-xl rounded-br-sm bg-invert px-4 py-2.5 text-sm text-on-invert">{m.text}</p>
              </div>
            ) : (
              <div key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-fg-3">
                  <SparkleIcon width={16} height={16} />
                </span>
                <p className="max-w-[82%] rounded-xl rounded-tl-sm border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-fg-2">
                  {m.text}
                </p>
              </div>
            ),
          )}

          {typing && (
            <div className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-fg-3">
                <SparkleIcon width={16} height={16} />
              </span>
              <div className="flex items-center gap-1 rounded-xl rounded-tl-sm border border-line bg-surface px-4 py-3.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#5a5a5a] [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#5a5a5a] [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#5a5a5a]" />
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-line bg-surface px-5 py-4">
          {messages.length <= 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-line-strong hover:text-fg"
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
            className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 transition-colors focus-within:border-fg-3"
          >
            <SparkleIcon className="shrink-0 text-fg-3" width={19} height={19} />
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask about today..."
              className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-dim"
            />
            <button
              type="submit"
              aria-label="Send"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-dim transition-colors hover:bg-surface-2 hover:text-fg"
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
