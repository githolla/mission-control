import { useMemo, useState } from 'react'
import { buildGraph, typeMeta, type GraphNode, type NodeType } from '../lib/graph'
import Graph, { NodePanel } from './Graph'
import ChatModal from './ChatModal'

const order: NodeType[] = ['project', 'team', 'mission', 'person', 'decision', 'anomaly', 'gate', 'station', 'doc', 'action', 'signal', 'ambient']

export default function NetworkBoard({ height = 640 }: { height?: number | string }) {
  const graph = useMemo(() => buildGraph(), [])
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [hidden, setHidden] = useState<Set<NodeType>>(new Set())
  const [query, setQuery] = useState('')
  const [chat, setChat] = useState<{ open: boolean; seed?: string }>({ open: false })
  const [centerOn, setCenterOn] = useState<{ id: string; n: number } | null>(null)

  const counts = useMemo(() => {
    const c = new Map<NodeType, number>()
    for (const n of graph.nodes) c.set(n.type, (c.get(n.type) ?? 0) + 1)
    return c
  }, [graph])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return graph.nodes.filter((n) => n.label.toLowerCase().includes(q) || n.sub?.toLowerCase().includes(q)).slice(0, 8)
  }, [query, graph])

  const toggle = (t: NodeType) =>
    setHidden((h) => {
      const n = new Set(h)
      if (n.has(t)) n.delete(t)
      else n.add(t)
      return n
    })

  const visibleCount = graph.nodes.filter((n) => !hidden.has(n.type)).length

  return (
    <div className="flex flex-col" style={{ height }}>
      {/* toolbar: search + counts */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--hud-text)]">Company network</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--hud-dim)]">Every dot is a record · every line a relationship · click, drag, scroll</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a node…"
              className="w-56 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg outline-none placeholder:text-dim focus:border-fg-3"
            />
            {matches.length > 0 && (
              <ul className="absolute right-0 top-full z-20 mt-1 w-80 overflow-hidden rounded-lg border border-line bg-surface shadow-2xl">
                {matches.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        setSelected(n)
                        setCenterOn({ id: n.id, n: Date.now() })
                        setQuery('')
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-fg-2 hover:bg-surface-2 hover:text-fg"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: n.color }} />
                      <span className="min-w-0 flex-1 truncate">{n.label}</span>
                      <span className="text-[9.5px] uppercase tracking-[0.12em] text-dim">{typeMeta[n.type].label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <span className="font-mono text-[11px] text-dim">
            {visibleCount} nodes · {graph.links.length} links
          </span>
        </div>
      </div>

      {/* legend / filters */}
      <div className="flex flex-wrap gap-1.5 pb-3">
        {order.map((t) => {
          const off = hidden.has(t)
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${off ? 'border-line text-dim' : 'border-white/15 text-fg-2 hover:text-white'}`}
              title={off ? 'Show' : 'Hide'}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: off ? 'transparent' : typeMeta[t].color, boxShadow: off ? `inset 0 0 0 1px ${typeMeta[t].color}` : undefined }} />
              {typeMeta[t].label}
              <span className="font-mono text-[9.5px] text-dim">{counts.get(t) ?? 0}</span>
            </button>
          )
        })}
      </div>

      {/* graph + panel */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card relative min-h-0 overflow-hidden p-0">
          <div className="stars absolute inset-0 opacity-40" />
          <Graph nodes={graph.nodes} links={graph.links} height="100%" selectedId={selected?.id ?? null} onSelect={setSelected} hidden={hidden} centerOn={centerOn} className="relative h-full" />
        </div>
        <div className="card min-h-0 overflow-hidden p-5">
          {selected ? (
            <NodePanel node={selected} nodes={graph.nodes} links={graph.links} onSelect={setSelected} onAsk={(q) => setChat({ open: true, seed: q })} />
          ) : (
            <div className="flex h-full flex-col">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-dim">Reading the graph</div>
              <ul className="mt-3 space-y-3 text-[12.5px] leading-relaxed text-fg-2">
                <li>
                  <span className="text-white">Six amber hubs</span> are the base projects. Purple hubs are the three teams. Everything else orbits what it belongs to.
                </li>
                <li>
                  <span className="text-white">Small dots</span> are individual signals the AI ingested — Jira tickets, commits, Slack threads, lab runs, supplier notices — each linked to the mission it was read against.
                </li>
                <li>
                  <span className="text-white">The outer ring</span> is ambient: market, research, regulatory, supplier and hiring signals being watched but not yet tied to a mission.
                </li>
                <li>
                  <span className="text-white">Colour is status</span> where it matters: amber-tinted missions and people are at risk, red is blocked or NO-GO.
                </li>
              </ul>
              <div className="mt-auto border-t border-line pt-4 text-[11px] text-dim">Click any dot for its record and connections. Toggle the chips above to isolate a layer.</div>
            </div>
          )}
        </div>
      </div>

      <ChatModal open={chat.open} seed={chat.seed} onClose={() => setChat({ open: false })} />
    </div>
  )
}
