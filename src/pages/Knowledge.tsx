import { useMemo, useState } from 'react'
import { knowledge } from '../data'
import { Card, SectionHeading, IconTile } from '../components/ui'
import { BookIcon, SearchIcon } from '../components/icons'
import { useToast } from '../components/Toast'

export default function Knowledge() {
  const { notify } = useToast()
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return knowledge
    return knowledge.filter(
      (k) =>
        k.title.toLowerCase().includes(q) ||
        k.category.toLowerCase().includes(q) ||
        k.summary.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="space-y-7">
      <SectionHeading
        eyebrow="Knowledge"
        title="Company knowledge"
        subtitle="The living record of your company — strategy, plans and runbooks."
      />

      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={16} height={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search knowledge..."
          className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm text-ink-900 outline-none transition-colors placeholder:text-slate-400 focus:border-ink-700"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((k) => (
          <button key={k.id} onClick={() => notify(`Opening “${k.title}”.`)} className="text-left">
            <Card className="lift flex h-full flex-col p-5">
              <div className="flex items-center justify-between">
                <IconTile className="h-9 w-9">
                  <BookIcon width={17} height={17} />
                </IconTile>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {k.category}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-ink-900">{k.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--color-muted)]">{k.summary}</p>
              <p className="mt-4 border-t border-line pt-3 text-[11px] uppercase tracking-[0.1em] text-slate-400">
                Updated {k.updated}
              </p>
            </Card>
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <Card className="p-10 text-center text-sm text-[var(--color-muted)]">No documents match “{query}”.</Card>
      )}
    </div>
  )
}
