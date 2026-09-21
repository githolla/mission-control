import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { typeMeta, type GraphLink, type GraphNode, type NodeType } from '../lib/graph'
import { ArrowRightIcon, SparkleIcon } from './icons'

/**
 * Force-directed company graph on a canvas. Custom simulation (no library):
 * link springs, pairwise repulsion, weak centre gravity, an outer ring of
 * pinned ambient nodes. Pan (drag background), zoom (wheel), drag nodes,
 * hover for a tooltip, click to select + highlight the neighbourhood.
 */

type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number; fx?: number; fy?: number }
type SimLink = { s: SimNode; t: SimNode; kind: string; len: number }

const REST: Record<string, number> = {
  owns: 150,
  leads: 70,
  member: 62,
  'rolls-up': 105,
  team: 120,
  owner: 55,
  protects: 90,
  gates: 80,
  polls: 95,
  documents: 95,
  flags: 70,
  recommends: 75,
  signal: 22,
}

type Sim = { nodes: SimNode[]; links: SimLink[]; byId: Map<string, SimNode>; adj: Map<string, Set<string>>; alpha: number; R: number }

/** One simulation step: springs, repulsion, gravity, integration. */
function physics(S: Sim, W: number, H: number, visible: (n: SimNode) => boolean) {
  const a = S.alpha
  const cx = W / 2
  const cy = H / 2
  const ns = S.nodes.filter((n) => !n.ring && visible(n))
  // springs
  for (const l of S.links) {
    if (!visible(l.s) || !visible(l.t)) continue
    let dx = l.t.x - l.s.x
    let dy = l.t.y - l.s.y
    const d = Math.hypot(dx, dy) || 0.01
    const k = l.kind === 'signal' ? 0.22 : l.kind === 'member' || l.kind === 'owner' || l.kind === 'leads' ? 0.12 : 0.08
    const f = ((d - l.len) / d) * k * a
    const ws = l.t.size / (l.s.size + l.t.size)
    const wt = 1 - ws
    dx *= f
    dy *= f
    if (l.s.fx === undefined) {
      l.s.vx += dx * ws
      l.s.vy += dy * ws
    }
    if (l.t.fx === undefined) {
      l.t.vx -= dx * wt
      l.t.vy -= dy * wt
    }
  }
  // repulsion (pairwise, cut off)
  const cut = 170
  for (let i = 0; i < ns.length; i++) {
    const p = ns[i]
    for (let j = i + 1; j < ns.length; j++) {
      const q = ns[j]
      let dx = q.x - p.x
      let dy = q.y - p.y
      if (dx > cut || dx < -cut || dy > cut || dy < -cut) continue
      let d2 = dx * dx + dy * dy
      if (d2 < 1) {
        dx = 0.5
        dy = 0.3
        d2 = 0.34
      }
      if (d2 > cut * cut) continue
      const d = Math.sqrt(d2)
      const minD = p.size + q.size + 5
      let f = ((p.size * q.size * 2.4 + 1.5) * a) / d2
      if (d < minD) f += ((minD - d) / d) * 0.5 * a
      dx *= f
      dy *= f
      p.vx -= dx
      p.vy -= dy
      q.vx += dx
      q.vy += dy
    }
  }
  // gravity + integrate
  const limit = S.R - 30
  for (const n of ns) {
    n.vx += (cx - n.x) * 0.012 * a
    n.vy += (cy - n.y) * 0.012 * a
    if (n.fx !== undefined && n.fy !== undefined) {
      n.x = n.fx
      n.y = n.fy
      n.vx = n.vy = 0
      continue
    }
    n.vx *= 0.5
    n.vy *= 0.5
    n.x += n.vx
    n.y += n.vy
    const dx = n.x - cx
    const dy = n.y - cy
    const r = Math.hypot(dx, dy)
    if (r > limit) {
      n.x = cx + (dx / r) * limit
      n.y = cy + (dy / r) * limit
    }
  }
}

export type GraphProps = {
  nodes: GraphNode[]
  links: GraphLink[]
  height?: number | string
  ring?: boolean
  selectedId?: string | null
  onSelect?: (n: GraphNode | null) => void
  hidden?: Set<NodeType>
  labels?: 'auto' | 'all'
  className?: string
  rootId?: string // placed at the centre (ego graphs)
  centerOn?: { id: string; n: number } | null // pan/zoom to a node when this changes
}

export default function Graph({ nodes, links, height = 600, ring = true, selectedId = null, onSelect, hidden, labels = 'auto', className = '', rootId, centerOn = null }: GraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const sim = useRef<Sim>({ nodes: [], links: [], byId: new Map(), adj: new Map(), alpha: 1, R: 0 })
  const view = useRef({ x: 0, y: 0, k: 1 })
  const pointer = useRef<{ mode: 'none' | 'pan' | 'drag'; node?: SimNode; sx: number; sy: number; moved: boolean; vx0: number; vy0: number }>({ mode: 'none', sx: 0, sy: 0, moved: false, vx0: 0, vy0: 0 })
  const hoverRef = useRef<SimNode | null>(null)
  const selectedRef = useRef<string | null>(selectedId)
  const hiddenRef = useRef<Set<NodeType>>(hidden ?? new Set())
  const [tip, setTip] = useState<{ x: number; y: number; n: SimNode } | null>(null)
  const raf = useRef(0)

  useEffect(() => {
    selectedRef.current = selectedId
    sim.current.alpha = Math.max(sim.current.alpha, 0.05)
  }, [selectedId])
  useEffect(() => {
    hiddenRef.current = hidden ?? new Set()
    sim.current.alpha = Math.max(sim.current.alpha, 0.3)
  }, [hidden])

  /* ── build the simulation whenever the data changes ── */
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const W = wrap.clientWidth
    const H = wrap.clientHeight
    const cx = W / 2
    const cy = H / 2
    const R = Math.min(W, H) * 0.47
    const byId = new Map<string, SimNode>()
    const adj = new Map<string, Set<string>>()
    const groups = new Map<string, { x: number; y: number }>()
    const projectIds = nodes.filter((n) => n.type === 'project' && n.id !== rootId).map((n) => n.id)
    projectIds.forEach((id, i) => {
      const a = (i / projectIds.length) * Math.PI * 2 - Math.PI / 2
      const rr = rootId ? R * 0.8 : R * 0.42
      groups.set(id, { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr })
    })
    if (rootId) groups.set(rootId, { x: cx, y: cy })
    let seed = 7
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
    const ringNodes = nodes.filter((n) => n.ring)
    let ri = 0
    const sn: SimNode[] = nodes.map((n) => {
      let x: number, y: number, fx: number | undefined, fy: number | undefined
      if (n.ring) {
        const a = (ri / ringNodes.length) * Math.PI * 2
        const rr = R * (ri % 2 === 0 ? 1.0 : 0.955)
        ri++
        x = fx = cx + Math.cos(a) * rr
        y = fy = cy + Math.sin(a) * rr
      } else {
        const g = (n.group && groups.get(n.group)) || { x: cx, y: cy }
        const spread = n.type === 'project' ? 0 : n.type === 'team' ? R * 0.15 : R * 0.22
        x = g.x + (rnd() - 0.5) * spread * 2
        y = g.y + (rnd() - 0.5) * spread * 2
      }
      if (n.id === rootId) {
        fx = cx
        fy = cy
      }
      const node: SimNode = { ...n, x, y, vx: 0, vy: 0, fx, fy }
      byId.set(n.id, node)
      adj.set(n.id, new Set())
      return node
    })
    const sl: SimLink[] = []
    for (const l of links) {
      const s = byId.get(l.source)
      const t = byId.get(l.target)
      if (!s || !t) continue
      sl.push({ s, t, kind: l.kind, len: l.kind === 'signal' ? 12 + rnd() * 26 : (REST[l.kind] ?? 80) })
      adj.get(s.id)!.add(t.id)
      adj.get(t.id)!.add(s.id)
    }
    const S: Sim = { nodes: sn, links: sl, byId, adj, alpha: 1, R }
    // settle before first paint so the graph appears already laid out
    const vis = (n: SimNode) => !hiddenRef.current.has(n.type)
    for (let i = 0; i < 220; i++) {
      physics(S, W, H, vis)
      S.alpha *= 0.985
    }
    S.alpha = 0.12
    sim.current = S
    view.current = { x: 0, y: 0, k: 1 }
  }, [nodes, links, rootId])

  /* ── centre the view on a node (search picks) ── */
  useEffect(() => {
    if (!centerOn) return
    const n = sim.current.byId.get(centerOn.id)
    const wrap = wrapRef.current
    if (!n || !wrap) return
    const k = Math.max(view.current.k, 1.8)
    view.current = { k, x: wrap.clientWidth / 2 - n.x * k, y: wrap.clientHeight / 2 - n.y * k }
  }, [centerOn])

  /* ── simulation + render loop ── */
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const visible = (n: SimNode) => !hiddenRef.current.has(n.type)

    const tick = () => {
      const S = sim.current
      if (S.alpha > 0.004) {
        physics(S, wrap.clientWidth, wrap.clientHeight, visible)
        S.alpha *= 0.985
      }
      draw()
      raf.current = requestAnimationFrame(tick)
    }

    const draw = () => {
      const S = sim.current
      const W = wrap.clientWidth
      const H = wrap.clientHeight
      if (canvas.width !== Math.floor(W * dpr) || canvas.height !== Math.floor(H * dpr)) {
        canvas.width = Math.floor(W * dpr)
        canvas.height = Math.floor(H * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const v = view.current
      ctx.translate(v.x, v.y)
      ctx.scale(v.k, v.k)

      const sel = selectedRef.current ? S.byId.get(selectedRef.current) : undefined
      const hov = hoverRef.current
      const focus = sel ?? hov ?? null
      const neigh = focus ? S.adj.get(focus.id) ?? new Set<string>() : null
      const inFocus = (n: SimNode) => !focus || n.id === focus.id || neigh!.has(n.id)

      // ring guide
      if (ring) {
        ctx.beginPath()
        ctx.arc(W / 2, H / 2, S.R * 0.978, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(120,140,200,0.08)'
        ctx.lineWidth = 1 / v.k
        ctx.stroke()
      }

      // links
      ctx.lineWidth = 0.7 / v.k
      ctx.beginPath()
      for (const l of S.links) {
        if (!visible(l.s) || !visible(l.t)) continue
        if (focus && !(l.s.id === focus.id || l.t.id === focus.id)) {
          ctx.moveTo(l.s.x, l.s.y)
          ctx.lineTo(l.t.x, l.t.y)
        } else if (!focus) {
          ctx.moveTo(l.s.x, l.s.y)
          ctx.lineTo(l.t.x, l.t.y)
        }
      }
      ctx.strokeStyle = focus ? 'rgba(130,150,210,0.07)' : 'rgba(130,150,210,0.2)'
      ctx.stroke()
      if (focus) {
        ctx.beginPath()
        for (const l of S.links) {
          if (!visible(l.s) || !visible(l.t)) continue
          if (l.s.id === focus.id || l.t.id === focus.id) {
            ctx.moveTo(l.s.x, l.s.y)
            ctx.lineTo(l.t.x, l.t.y)
          }
        }
        ctx.strokeStyle = 'rgba(160,190,255,0.75)'
        ctx.lineWidth = 1.1 / v.k
        ctx.stroke()
      }

      // nodes
      for (const n of S.nodes) {
        if (!visible(n)) continue
        const dim = focus ? !inFocus(n) : false
        ctx.globalAlpha = dim ? 0.18 : 1
        if (n.size >= 9) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.size * 2.2, 0, Math.PI * 2)
          ctx.fillStyle = n.color + '22'
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2)
        ctx.fillStyle = n.color
        ctx.fill()
        if (focus && n.id === focus.id) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.size + 4 / v.k, 0, Math.PI * 2)
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1.2 / v.k
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1

      // labels
      const showLabel = (n: SimNode) => {
        if (labels === 'all') return n.type !== 'signal' && n.type !== 'ambient'
        if (focus && n.id === focus.id) return true
        if (focus && neigh!.has(n.id)) return (n.type !== 'signal' && n.type !== 'ambient') || v.k > 1.4
        if (n.type === 'project' || n.type === 'team') return true
        if (v.k > 1.5 && (n.type === 'mission' || n.type === 'decision' || n.type === 'anomaly' || n.type === 'gate' || n.type === 'doc' || n.type === 'station' || n.type === 'action')) return true
        if (v.k > 2.6 && n.type === 'person') return true
        if (v.k > 3.4) return true
        return false
      }
      ctx.textBaseline = 'middle'
      for (const n of S.nodes) {
        if (!visible(n) || !showLabel(n)) continue
        const big = n.type === 'project' || n.type === 'team'
        const fs = (big ? 11.5 : n.type === 'signal' || n.type === 'ambient' ? 8.5 : 9.5) / v.k
        ctx.font = `${big ? 600 : 500} ${fs}px ${big ? 'Montserrat' : 'Inter'}, sans-serif`
        const dim = focus ? !inFocus(n) : false
        ctx.globalAlpha = dim ? 0.15 : 1
        const text = big ? n.label.toUpperCase() : n.label
        const tx = n.x + n.size + 4 / v.k
        const ty = n.y
        ctx.lineWidth = 3 / v.k
        ctx.strokeStyle = 'rgba(6,10,18,0.85)'
        ctx.strokeText(text, tx, ty)
        ctx.fillStyle = big ? '#ffffff' : '#cfd7e6'
        ctx.fillText(text, tx, ty)
      }
      ctx.globalAlpha = 1
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [ring, labels])

  /* ── pointer interaction ── */
  const toWorld = useCallback((sx: number, sy: number) => {
    const v = view.current
    return { x: (sx - v.x) / v.k, y: (sy - v.y) / v.k }
  }, [])
  const hit = useCallback(
    (sx: number, sy: number): SimNode | null => {
      const { x, y } = toWorld(sx, sy)
      const S = sim.current
      let best: SimNode | null = null
      let bd = Infinity
      for (const n of S.nodes) {
        if (hiddenRef.current.has(n.type)) continue
        const r = Math.max(n.size, 4) + 3 / view.current.k
        const d = Math.hypot(n.x - x, n.y - y)
        if (d <= r && d < bd) {
          bd = d
          best = n
        }
      }
      return best
    },
    [toWorld],
  )
  const local = (e: React.MouseEvent | MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { sx: e.clientX - r.left, sy: e.clientY - r.top }
  }

  const onDown = (e: React.MouseEvent) => {
    const { sx, sy } = local(e)
    const n = hit(sx, sy)
    pointer.current = { mode: n ? 'drag' : 'pan', node: n ?? undefined, sx, sy, moved: false, vx0: view.current.x, vy0: view.current.y }
    if (n && !n.ring) {
      n.fx = n.x
      n.fy = n.y
    }
  }
  const onMove = (e: React.MouseEvent) => {
    const { sx, sy } = local(e)
    const p = pointer.current
    if (p.mode === 'pan') {
      const dx = sx - p.sx
      const dy = sy - p.sy
      if (Math.abs(dx) + Math.abs(dy) > 3) p.moved = true
      view.current.x = p.vx0 + dx
      view.current.y = p.vy0 + dy
      return
    }
    if (p.mode === 'drag' && p.node) {
      if (Math.abs(sx - p.sx) + Math.abs(sy - p.sy) > 3) p.moved = true
      if (!p.node.ring) {
        const w = toWorld(sx, sy)
        p.node.fx = w.x
        p.node.fy = w.y
        sim.current.alpha = Math.max(sim.current.alpha, 0.25)
      }
      return
    }
    const n = hit(sx, sy)
    hoverRef.current = n
    setTip(n ? { x: sx, y: sy, n } : null)
    canvasRef.current!.style.cursor = n ? 'pointer' : 'grab'
  }
  const onUp = (e: React.MouseEvent) => {
    const p = pointer.current
    if (p.mode === 'drag' && p.node) {
      if (!p.node.ring) {
        p.node.fx = undefined
        p.node.fy = undefined
      }
      if (!p.moved) onSelect?.(p.node)
    } else if (p.mode === 'pan' && !p.moved) {
      onSelect?.(null)
    }
    pointer.current = { mode: 'none', sx: 0, sy: 0, moved: false, vx0: 0, vy0: 0 }
    const { sx, sy } = local(e)
    hoverRef.current = hit(sx, sy)
  }
  const onLeave = () => {
    hoverRef.current = null
    setTip(null)
    const p = pointer.current
    if (p.mode === 'drag' && p.node && !p.node.ring) {
      p.node.fx = undefined
      p.node.fy = undefined
    }
    pointer.current = { mode: 'none', sx: 0, sy: 0, moved: false, vx0: 0, vy0: 0 }
  }
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = c.getBoundingClientRect()
      const sx = e.clientX - r.left
      const sy = e.clientY - r.top
      const v = view.current
      const k2 = Math.min(4.5, Math.max(0.4, v.k * Math.exp(-e.deltaY * 0.0012)))
      v.x = sx - ((sx - v.x) * k2) / v.k
      v.y = sy - ((sy - v.y) * k2) / v.k
      v.k = k2
    }
    c.addEventListener('wheel', onWheel, { passive: false })
    return () => c.removeEventListener('wheel', onWheel)
  }, [])

  const resetView = () => {
    view.current = { x: 0, y: 0, k: 1 }
    sim.current.alpha = Math.max(sim.current.alpha, 0.2)
  }

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`} style={{ height }}>
      <canvas ref={canvasRef} className="block h-full w-full" style={{ cursor: 'grab' }} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onLeave} />
      {tip && (
        <div className="pointer-events-none absolute z-10 max-w-[260px] rounded-md border border-white/10 bg-[rgba(8,13,24,0.92)] px-3 py-2 backdrop-blur-md" style={{ left: tip.x + 14, top: tip.y + 14 }}>
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: tip.n.color }}>
            {typeMeta[tip.n.type].label.replace(/s$/, '')}
          </div>
          <div className="mt-0.5 text-[12px] font-medium leading-snug text-white">{tip.n.label}</div>
          {tip.n.sub && <div className="mt-0.5 text-[10.5px] leading-snug text-fg-3">{tip.n.sub}</div>}
        </div>
      )}
      <button onClick={resetView} className="absolute bottom-3 right-3 rounded-md border border-white/10 bg-[rgba(8,13,24,0.7)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-3 hover:text-white">
        Reset view
      </button>
    </div>
  )
}

/* ── detail panel for a selected node ───────────────────────────────── */
export function NodePanel({ node, nodes, links, onSelect, onAsk }: { node: GraphNode; nodes: GraphNode[]; links: GraphLink[]; onSelect: (n: GraphNode) => void; onAsk?: (q: string) => void }) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const related = useMemo(() => {
    const out: { n: GraphNode; kind: string }[] = []
    for (const l of links) {
      if (l.source === node.id) {
        const n = byId.get(l.target)
        if (n) out.push({ n, kind: l.kind })
      } else if (l.target === node.id) {
        const n = byId.get(l.source)
        if (n) out.push({ n, kind: l.kind })
      }
    }
    const order: NodeType[] = ['project', 'team', 'mission', 'decision', 'anomaly', 'gate', 'station', 'doc', 'action', 'person', 'signal', 'ambient']
    return out.sort((a, b) => order.indexOf(a.n.type) - order.indexOf(b.n.type))
  }, [node, links, byId])
  const groups = useMemo(() => {
    const g = new Map<NodeType, GraphNode[]>()
    for (const r of related) g.set(r.n.type, [...(g.get(r.n.type) ?? []), r.n])
    return [...g.entries()]
  }, [related])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: node.color }} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: node.color }}>
          {typeMeta[node.type].label.replace(/s$/, '')}
        </span>
      </div>
      <h3 className="mt-2 font-display text-[17px] font-semibold leading-snug text-white">{node.label}</h3>
      {node.sub && <div className="mt-1 text-[11.5px] text-fg-3">{node.sub}</div>}
      {node.desc && <p className="mt-3 text-[12.5px] leading-relaxed text-fg-2">{node.desc}</p>}
      {node.meta && node.meta.length > 0 && (
        <dl className="mt-4 divide-y divide-white/10 border-y border-white/10">
          {node.meta.map((m, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 text-[11.5px]">
              <dt className="uppercase tracking-[0.1em] text-dim">{m.k}</dt>
              <dd className="max-w-[60%] truncate text-right text-fg">{m.v}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-4 flex gap-2">
        {node.to && (
          <Link to={node.to} className="btn btn-primary !py-1.5 text-xs">
            Open
            <ArrowRightIcon width={14} height={14} />
          </Link>
        )}
        {onAsk && (node.type === 'project' || node.type === 'mission' || node.type === 'team') && (
          <button onClick={() => onAsk(`Forecast for ${node.label}`)} className="btn btn-secondary !py-1.5 text-xs">
            <SparkleIcon width={13} height={13} />
            Ask AI
          </button>
        )}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-dim">Connections</span>
        <span className="font-mono text-[10px] text-dim">{related.length}</span>
      </div>
      <div className="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {groups.map(([type, ns]) => (
          <div key={type}>
            <div className="mb-1 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: typeMeta[type].color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: typeMeta[type].color }} />
              {typeMeta[type].label} · {ns.length}
            </div>
            <ul className="space-y-0.5">
              {ns.slice(0, 24).map((n) => (
                <li key={n.id}>
                  <button onClick={() => onSelect(n)} className="group flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-[11.5px] text-fg-2 hover:bg-white/[0.06] hover:text-white">
                    <span className="min-w-0 flex-1 truncate">{n.label}</span>
                    <ArrowRightIcon width={12} height={12} className="shrink-0 text-dim opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </li>
              ))}
              {ns.length > 24 && <li className="px-1.5 text-[10.5px] text-dim">+{ns.length - 24} more</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
