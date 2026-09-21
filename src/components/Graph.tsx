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
      if (p.size >= 9 && q.size >= 9) f *= 7
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
  for (const n of ns) {
    const limit = S.R * (n.size >= 9 ? 0.6 : 0.84)
    const g = 0.012 * (1 + n.size / 12)
    n.vx += (cx - n.x) * g * a
    n.vy += (cy - n.y) * g * a
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
      const over = r - limit
      n.x -= (dx / r) * over * 0.5
      n.y -= (dy / r) * over * 0.5
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
        const a = (ri / ringNodes.length) * Math.PI * 2 - Math.PI / 2
        const rr = R * (ri % 2 === 0 ? 1.0 : 0.965)
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

    const STRUCT = new Set(['owns', 'rolls-up', 'team', 'leads', 'member', 'owner', 'protects', 'gates', 'polls', 'documents', 'flags', 'recommends'])
    const arcLabel = (text: string, cx: number, cy: number, r: number, ang: number, k: number) => {
      ctx.save()
      ctx.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r)
      const flip = Math.cos(ang) < 0
      ctx.rotate(ang + (flip ? -Math.PI / 2 : Math.PI / 2))
      ctx.font = `600 ${8.5 / k}px Montserrat, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(160,175,205,0.7)'
      ctx.fillText(text.toUpperCase().split('').join(String.fromCharCode(8202)), 0, 0)
      ctx.restore()
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
      const cx = W / 2
      const cy = H / 2

      const sel = selectedRef.current ? S.byId.get(selectedRef.current) : undefined
      const hov = hoverRef.current
      const focus = sel ?? hov ?? null
      const neigh = focus ? S.adj.get(focus.id) ?? new Set<string>() : null
      const inFocus = (n: SimNode) => !focus || n.id === focus.id || neigh!.has(n.id)

      // radar backdrop: centre glow, range rings, cross ticks
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, S.R)
      glow.addColorStop(0, 'rgba(111,168,255,0.10)')
      glow.addColorStop(0.6, 'rgba(111,168,255,0.03)')
      glow.addColorStop(1, 'rgba(111,168,255,0)')
      ctx.fillStyle = glow
      ctx.fillRect(cx - S.R * 1.2, cy - S.R * 1.2, S.R * 2.4, S.R * 2.4)
      ctx.lineWidth = 1 / v.k
      for (const f of [0.28, 0.56, 0.84]) {
        ctx.beginPath()
        ctx.arc(cx, cy, S.R * f, 0, Math.PI * 2)
        ctx.strokeStyle = f === 0.84 ? 'rgba(120,140,200,0.16)' : 'rgba(120,140,200,0.07)'
        ctx.setLineDash(f === 0.84 ? [] : [2 / v.k, 6 / v.k])
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.strokeStyle = 'rgba(120,140,200,0.10)'
      for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2
        const r0 = S.R * (i % 6 === 0 ? 0.86 : 0.88)
        const r1 = S.R * 0.9
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0)
        ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1)
        ctx.stroke()
      }
      if (ring) {
        // ambient ring: segment arcs + category labels
        const ringNodes = S.nodes.filter((n) => n.ring)
        if (ringNodes.length) {
          const cats: { name: string; from: number; to: number; color: string }[] = []
          ringNodes.forEach((n, i) => {
            const name = (n.sub ?? '').split(' · ')[0]
            const ang = (i / ringNodes.length) * Math.PI * 2 - Math.PI / 2
            const last = cats[cats.length - 1]
            if (last && last.name === name) last.to = ang
            else cats.push({ name, from: ang, to: ang, color: n.color })
          })
          const step = (Math.PI * 2) / ringNodes.length
          for (const c of cats) {
            ctx.beginPath()
            ctx.arc(cx, cy, S.R * 1.06, c.from - step * 0.3, c.to + step * 0.3)
            ctx.strokeStyle = c.color + '55'
            ctx.lineWidth = 1.2 / v.k
            ctx.stroke()
            arcLabel(c.name, cx, cy, S.R * 1.11, (c.from + c.to) / 2, v.k)
          }
        }
      }

      // links: structural (weighted) vs signal hairlines tinted by source
      const paths = new Map<string, Path2D>()
      const seg = (key: string, l: SimLink) => {
        let p = paths.get(key)
        if (!p) {
          p = new Path2D()
          paths.set(key, p)
        }
        p.moveTo(l.s.x, l.s.y)
        p.lineTo(l.t.x, l.t.y)
      }
      const hot: SimLink[] = []
      for (const l of S.links) {
        if (!visible(l.s) || !visible(l.t)) continue
        if (focus && (l.s.id === focus.id || l.t.id === focus.id)) {
          hot.push(l)
          continue
        }
        if (STRUCT.has(l.kind)) seg('struct', l)
        else seg(`sig:${l.s.type === 'signal' ? l.s.color : l.t.color}`, l)
      }
      const dimF = focus ? 0.35 : 1
      for (const [key, p] of paths) {
        if (key === 'struct') {
          ctx.lineWidth = 0.9 / v.k
          ctx.strokeStyle = `rgba(150,170,225,${0.3 * dimF})`
        } else {
          ctx.lineWidth = 0.55 / v.k
          ctx.strokeStyle = key.slice(4) + (focus ? '18' : '2e')
        }
        ctx.stroke(p)
      }
      if (hot.length) {
        ctx.beginPath()
        for (const l of hot) {
          ctx.moveTo(l.s.x, l.s.y)
          ctx.lineTo(l.t.x, l.t.y)
        }
        ctx.strokeStyle = 'rgba(190,210,255,0.85)'
        ctx.lineWidth = 1.2 / v.k
        ctx.stroke()
      }

      // nodes: outlined discs; hubs get a halo + ring + code
      for (const n of S.nodes) {
        if (!visible(n)) continue
        const dim = focus ? !inFocus(n) : false
        ctx.globalAlpha = dim ? 0.16 : 1
        const isHub = n.type === 'project' || n.type === 'team'
        if (isHub) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.size * 2.4, 0, Math.PI * 2)
          ctx.fillStyle = n.color + '1a'
          ctx.fill()
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.size + 5 / v.k, 0, Math.PI * 2)
          ctx.strokeStyle = n.color + '66'
          ctx.lineWidth = 1 / v.k
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2)
        ctx.fillStyle = n.type === 'team' ? '#0b111c' : n.color
        ctx.fill()
        ctx.lineWidth = (n.type === 'team' ? 2.2 : n.size >= 4 ? 1.1 : 0.6) / v.k
        ctx.strokeStyle = n.type === 'team' ? n.color : 'rgba(6,10,18,0.9)'
        ctx.stroke()
        if (n.type === 'project') {
          const code = (n.sub ?? '').split(' · ')[0]
          ctx.font = `700 ${8 / Math.max(v.k, 0.9)}px "JetBrains Mono", monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#0b111c'
          ctx.fillText(code, n.x, n.y + 0.5 / v.k)
          ctx.textAlign = 'left'
        }
        if (focus && n.id === focus.id) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.size + 9 / v.k, 0, Math.PI * 2)
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1.4 / v.k
          ctx.setLineDash([3 / v.k, 3 / v.k])
          ctx.stroke()
          ctx.setLineDash([])
        }
      }
      ctx.globalAlpha = 1

      // labels: pills for hubs + missions, plain for the rest, revealed with zoom
      const showLabel = (n: SimNode) => {
        if (labels === 'all') return n.type !== 'signal' && n.type !== 'ambient'
        if (focus && n.id === focus.id) return true
        if (focus && neigh!.has(n.id)) return (n.type !== 'signal' && n.type !== 'ambient') || v.k > 1.4
        if (n.type === 'project' || n.type === 'team' || n.type === 'mission') return true
        if (v.k > 1.25 && (n.type === 'decision' || n.type === 'anomaly' || n.type === 'gate' || n.type === 'doc' || n.type === 'station' || n.type === 'action')) return true
        if (v.k > 2.4 && n.type === 'person') return true
        if (v.k > 3.2) return true
        return false
      }
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      const placed: { x: number; y: number; w: number; h: number }[] = []
      const rank = (n: SimNode) => (n.type === 'project' ? 0 : n.type === 'team' ? 1 : n.type === 'mission' ? 2 : focus && n.id === focus.id ? 0 : 3)
      const labelled = S.nodes.filter((n) => visible(n) && showLabel(n)).sort((p, q) => rank(p) - rank(q))
      for (const n of labelled) {
        const hub = n.type === 'project' || n.type === 'team'
        const pill = hub || n.type === 'mission'
        const fs = (hub ? 10.5 : n.type === 'mission' ? 9 : n.type === 'signal' || n.type === 'ambient' ? 8.5 : 9.5) / v.k
        ctx.font = `${hub ? 700 : n.type === 'mission' ? 600 : 500} ${fs}px ${pill ? 'Montserrat' : 'Inter'}, sans-serif`
        const dim = focus ? !inFocus(n) : false
        ctx.globalAlpha = dim ? 0.14 : 1
        const text = pill ? n.label.toUpperCase() : n.label
        const w = ctx.measureText(text).width
        const h = fs + 8 / v.k
        const hits = (bx: { x: number; y: number; w: number; h: number }) => placed.some((r) => bx.x < r.x + r.w && bx.x + bx.w > r.x && bx.y < r.y + r.h && bx.y + bx.h > r.y)
        // candidate anchors: right of the node, then below, above and left (hubs and the focused node never drop)
        const cands = [
          { tx: n.x + n.size + 7 / v.k, ty: n.y },
          { tx: n.x - w / 2, ty: n.y + n.size + h / 2 + 4 / v.k },
          { tx: n.x - w / 2, ty: n.y - n.size - h / 2 - 4 / v.k },
          { tx: n.x - n.size - 7 / v.k - w, ty: n.y },
        ]
        let tx = cands[0].tx
        let ty = cands[0].ty
        let box = { x: tx - 5 / v.k, y: ty - h / 2, w: w + 10 / v.k, h }
        if (hits(box)) {
          const must = hub || (focus && n.id === focus.id)
          const alt = cands.slice(1).map((c) => ({ ...c, box: { x: c.tx - 5 / v.k, y: c.ty - h / 2, w: w + 10 / v.k, h } })).find((c) => !hits(c.box))
          if (alt) {
            tx = alt.tx
            ty = alt.ty
            box = alt.box
          } else if (!must) continue
        }
        placed.push(box)
        if (pill) {
          const padX = 5 / v.k
          ctx.fillStyle = 'rgba(8,13,24,0.86)'
          ctx.strokeStyle = (hub ? n.color : 'rgba(255,255,255,0.35)') + (hub ? '88' : '')
          ctx.lineWidth = 0.8 / v.k
          ctx.beginPath()
          ctx.roundRect(tx - padX, ty - h / 2, w + padX * 2, h, 3 / v.k)
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = hub ? '#ffffff' : '#dfe6f3'
          ctx.fillText(text, tx, ty + 0.5 / v.k)
        } else {
          ctx.lineWidth = 3 / v.k
          ctx.strokeStyle = 'rgba(6,10,18,0.85)'
          ctx.strokeText(text, tx, ty)
          ctx.fillStyle = '#cfd7e6'
          ctx.fillText(text, tx, ty)
        }
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
