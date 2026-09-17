import { useMemo, useState } from 'react'
import { knowledge } from '../data'
import { Card, SectionHeading } from '../components/ui'
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
    <div className="space-y-6">
      <SectionHeading title="Knowledge" subtitle="The living record of your company — strategy, plans and runbooks." />

      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={17} height={17} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search knowledge..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-ink-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/40"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((k) => (
          <button
            key={k.id}
            onClick={() => notify(`Opening “${k.title}”.`)}
            className="text-left"
          >
            <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-[0_8px_24px_-14px_rgba(15,30,53,0.28)]">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <BookIcon width={18} height={18} />
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  {k.category}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{k.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{k.summary}</p>
              <p className="mt-4 text-xs text-slate-400">Updated {k.updated}</p>
            </Card>
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-500">No documents match “{query}”.</Card>
      )}
    </div>
  )
}
