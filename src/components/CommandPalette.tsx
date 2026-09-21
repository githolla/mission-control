import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  RocketIcon,
  UsersIcon,
  FileIcon,
  SparkleIcon,
  BookIcon,
  SearchIcon,
  TargetIcon,
  CheckIcon,
  ChatIcon,
  PlayIcon,
  ArrowRightIcon,
} from './icons'
import { GridIcon, RadarIcon } from './icons'
import { projects, missions, teams, decisions, knowledge } from '../data'
import { useToast } from './Toast'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

type Item = {
  id: string
  label: string
  hint: string
  Icon: Icon
  /** Navigation target, or omitted for command-style actions. */
  to?: string
  /** Fired when the item has no route (e.g. toast actions). */
  action?: () => void
}

type Group = { title: string; items: Item[] }

const navDestinations: Item[] = [
  { id: 'go-overview', label: 'Overview', hint: 'Go to', Icon: HomeIcon, to: '/' },
  { id: 'go-control', label: 'Control Room', hint: 'Go to', Icon: RadarIcon, to: '/control-room' },
  { id: 'go-projects', label: 'Projects', hint: 'Go to', Icon: GridIcon, to: '/projects' },
  { id: 'go-missions', label: 'Missions', hint: 'Go to', Icon: RocketIcon, to: '/missions' },
  { id: 'go-teams', label: 'Teams', hint: 'Go to', Icon: UsersIcon, to: '/teams' },
  { id: 'go-decisions', label: 'Decisions', hint: 'Go to', Icon: FileIcon, to: '/decisions' },
  { id: 'go-analysis', label: 'AI Analysis', hint: 'Go to', Icon: SparkleIcon, to: '/analysis' },
  { id: 'go-network', label: 'Network', hint: 'Go to', Icon: SparkleIcon, to: '/network' },
  { id: 'go-ai', label: 'AI Activity', hint: 'Go to', Icon: SparkleIcon, to: '/ai-activity' },
  { id: 'go-knowledge', label: 'Knowledge', hint: 'Go to', Icon: BookIcon, to: '/knowledge' },
]

/** Actions build with the toast notifier so they can fire feedback. */
function buildActions(notify: (message: string, tone?: 'ai' | 'done') => void): Item[] {
  return [
    {
      id: 'act-approve',
      label: 'Approve supplier recovery plan',
      hint: 'Action',
      Icon: CheckIcon,
      action: () => notify('Supplier recovery plan approved — Oct 10 review protected.', 'done'),
    },
    {
      id: 'act-msg-priya',
      label: 'Message Priya Desai',
      hint: 'Action · Engineering',
      Icon: ChatIcon,
      action: () => notify('Opening a message to Priya Desai…'),
    },
    {
      id: 'act-msg-marcus',
      label: 'Message Marcus Chen',
      hint: 'Action · Operations',
      Icon: ChatIcon,
      action: () => notify('Opening a message to Marcus Chen…'),
    },
    {
      id: 'act-msg-elena',
      label: 'Message Elena Park',
      hint: 'Action · Commercial',
      Icon: ChatIcon,
      action: () => notify('Opening a message to Elena Park…'),
    },
    {
      id: 'act-briefing',
      label: 'Play morning briefing',
      hint: 'Action',
      Icon: PlayIcon,
      action: () => notify('Playing your morning briefing…'),
    },
  ]
}

/** Subsequence fuzzy match: every query char appears in order in the text. */
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true
  let i = 0
  for (let j = 0; j < text.length && i < query.length; j++) {
    if (text[j] === query[i]) i++
  }
  return i === query.length
}

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([])

  // The full, ordered index. Rebuilt only when the notifier identity changes.
  const groups = useMemo<Group[]>(
    () => [
      { title: 'Go to', items: navDestinations },
      {
        title: 'Projects',
        items: projects.map((p) => ({
          id: `project-${p.id}`,
          label: p.name,
          hint: `${p.code} · ${p.kind === 'product' ? 'Product' : 'In testing'}`,
          Icon: GridIcon,
          to: `/projects/${p.id}`,
        })),
      },
      {
        title: 'Missions',
        items: missions.map((m) => ({
          id: `mission-${m.id}`,
          label: m.name,
          hint: `Mission · ${m.team}`,
          Icon: TargetIcon,
          to: `/missions/${m.id}`,
        })),
      },
      {
        title: 'Teams',
        items: teams.map((t) => ({
          id: `team-${t.id}`,
          label: t.name,
          hint: `Team · ${t.lead}`,
          Icon: UsersIcon,
          to: `/teams#${t.id}`,
        })),
      },
      {
        title: 'Decisions',
        items: decisions.map((d) => ({
          id: `decision-${d.id}`,
          label: d.title,
          hint: 'Decision',
          Icon: FileIcon,
          to: '/decisions',
        })),
      },
      {
        title: 'Knowledge',
        items: knowledge.map((k) => ({
          id: `knowledge-${k.id}`,
          label: k.title,
          hint: `Knowledge · ${k.category}`,
          Icon: BookIcon,
          to: '/knowledge',
        })),
      },
      { title: 'Actions', items: buildActions(notify) },
    ],
    [notify],
  )

  // Filter each group; drop empty groups.
  const filteredGroups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((g) => ({
        title: g.title,
        items: g.items.filter((it) => {
          const hay = `${it.label} ${it.hint}`.toLowerCase()
          return hay.includes(q) || fuzzyMatch(hay, q)
        }),
      }))
      .filter((g) => g.items.length > 0)
  }, [groups, query])

  // Flattened list of selectable items, for arrow-key navigation.
  const flat = useMemo(() => filteredGroups.flatMap((g) => g.items), [filteredGroups])

  // Reset highlight to the first result whenever the query changes.
  useEffect(() => {
    setActive(0)
  }, [query])

  // Reset state and focus the input when the palette opens.
  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(t)
  }, [open])

  // Escape closes the palette (⌘K toggling is owned by Layout's global listener).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Keep the highlighted row visible.
  useEffect(() => {
    rowRefs.current[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  function activate(item: Item | undefined) {
    if (!item) return
    onClose()
    if (item.to) navigate(item.to)
    else item.action?.()
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (flat.length ? (a + 1) % flat.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      activate(flat[active])
    }
  }

  // Running index across groups so hover/keyboard highlight line up with `flat`.
  let flatIndex = -1

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] sm:pt-[14vh]">
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative flex max-h-[60vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl animate-[paletteIn_.2s_ease-out]"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <SearchIcon className="shrink-0 text-dim" width={18} height={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search missions, teams, actions…"
            className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-dim"
          />
          <kbd className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto py-2">
          {flat.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-dim">No results</div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.title} className="mb-1 last:mb-0">
                <div className="eyebrow px-4 pb-1 pt-2">{group.title}</div>
                {group.items.map((item) => {
                  flatIndex++
                  const idx = flatIndex
                  const isActive = idx === active
                  return (
                    <button
                      key={item.id}
                      ref={(el) => {
                        rowRefs.current[idx] = el
                      }}
                      onMouseMove={() => setActive(idx)}
                      onClick={() => activate(item)}
                      className={`relative flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-surface-2' : 'hover:bg-surface-2'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-invert" />
                      )}
                      <item.Icon
                        width={17}
                        height={17}
                        className={`shrink-0 ${isActive ? 'text-fg' : 'text-dim'}`}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                        {item.label}
                      </span>
                      <span className="hidden shrink-0 truncate text-xs text-[var(--color-muted)] sm:block">
                        {item.hint}
                      </span>
                      {isActive ? (
                        <kbd className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-line-strong text-[11px] text-[var(--color-muted)]">
                          ↵
                        </kbd>
                      ) : (
                        <ArrowRightIcon width={14} height={14} className="shrink-0 text-transparent" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-[var(--color-muted)]">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-line px-1 py-0.5 text-[10px]">↑</kbd>
            <kbd className="rounded border border-line px-1 py-0.5 text-[10px]">↓</kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-line px-1 py-0.5 text-[10px]">↵</kbd>
            to select
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes paletteIn{from{opacity:0;transform:translateY(-8px) scale(.99)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>
    </div>
  )
}
