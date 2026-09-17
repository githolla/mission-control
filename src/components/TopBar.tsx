import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SearchIcon } from './icons'
import { missions, teams, decisions, knowledge, user } from '../data'

const titles: Record<string, string> = {
  '/': 'Overview',
  '/missions': 'Missions',
  '/teams': 'Teams',
  '/decisions': 'Decisions',
  '/ai-activity': 'AI Activity',
  '/knowledge': 'Knowledge',
}

type Result = { label: string; kind: string; to: string }

function buildIndex(): Result[] {
  return [
    ...missions.map((m) => ({ label: m.name, kind: `Mission · ${m.team}`, to: '/missions' })),
    ...teams.map((t) => ({ label: t.name, kind: `Team · ${t.lead}`, to: `/teams#${t.id}` })),
    ...decisions.map((d) => ({ label: d.title, kind: 'Decision', to: '/decisions' })),
    ...knowledge.map((k) => ({ label: k.title, kind: `Knowledge · ${k.category}`, to: '/knowledge' })),
  ]
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const section = '/' + (location.pathname.split('/')[1] ?? '')
  const title = titles[section] ?? titles[location.pathname] ?? 'Overview'
  const index = useMemo(buildIndex, [])
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return index.filter((r) => r.label.toLowerCase().includes(q) || r.kind.toLowerCase().includes(q)).slice(0, 6)
  }, [query, index])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function go(to: string) {
    setOpen(false)
    setQuery('')
    navigate(to)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-[#f4f5f7]/85 px-8 backdrop-blur">
      <nav className="flex items-center gap-2.5 text-[13px]">
        <span className="font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">Command</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold uppercase tracking-[0.14em] text-ink-900">{title}</span>
      </nav>

      <div className="flex items-center gap-4">
        <span className="hidden items-center rounded-full border border-line-strong px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] sm:inline-flex">
          Demo data
        </span>

        <div ref={boxRef} className="relative">
          <div className="flex items-center">
            <SearchIcon className="pointer-events-none absolute left-3 text-slate-400" width={16} height={16} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search across your company..."
              className="h-9 w-[220px] rounded-lg border border-line bg-white pl-9 pr-3 text-sm text-ink-900 outline-none transition-[width,border-color] placeholder:text-slate-400 focus:w-[300px] focus:border-ink-700 lg:w-[280px]"
            />
          </div>

          {open && query.trim() && (
            <div className="absolute right-0 mt-2 w-[340px] overflow-hidden rounded-xl border border-line bg-white shadow-[0_16px_40px_-24px_rgba(10,11,14,0.4)]">
              {results.length ? (
                results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => go(r.to)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f4f5f7]"
                  >
                    <SearchIcon width={15} height={15} className="text-slate-400" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink-900">{r.label}</span>
                      <span className="block truncate text-xs text-[var(--color-muted)]">{r.kind}</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-sm text-slate-400">No results for “{query}”.</div>
              )}
            </div>
          )}
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
          {user.initials}
        </div>
      </div>
    </header>
  )
}
