import { useEffect, useState } from 'react'
import { user } from '../data'

/** Re-render on an interval so the greeting + clock stay live. */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

function greetingFor(d: Date) {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function Greeting({ onDark = false }: { onDark?: boolean }) {
  const now = useNow(1000)
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' })
  const date = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  const label = onDark
    ? 'text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'
    : 'eyebrow'
  const strong = onDark ? 'text-white' : 'text-ink-900'

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className={`mb-2 ${label}`}>
          {weekday}, {date}
        </div>
        <h1 className={`font-display text-4xl font-semibold tracking-tight sm:text-[2.6rem] ${strong}`}>
          {greetingFor(now)}, {user.firstName}.
        </h1>
      </div>

      {/* Live console clock */}
      <div className="text-right">
        <div className={`mb-1 ${label}`}>Local time</div>
        <div className={`font-mono text-2xl font-medium tracking-tight ${strong}`}>{time}</div>
      </div>
    </div>
  )
}
