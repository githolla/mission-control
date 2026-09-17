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

export default function Greeting() {
  const now = useNow(1000)
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' })
  const date = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="eyebrow mb-2">
          {weekday}, {date}
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-[2.6rem]">
          {greetingFor(now)}, {user.firstName}.
        </h1>
      </div>

      {/* Live console clock */}
      <div className="text-right">
        <div className="eyebrow mb-1">Local time</div>
        <div className="font-display text-2xl font-semibold tabular-nums tracking-tight text-ink-900">{time}</div>
      </div>
    </div>
  )
}
