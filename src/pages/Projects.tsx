import { Link } from 'react-router-dom'
import { productProjects, explorationProjects, type Project, type Status } from '../data'
import { StatusPill, SectionHeading } from '../components/ui'
import { ArrowRightIcon } from '../components/icons'

const barColor: Record<Status, string> = {
  'on-track': 'bg-[var(--color-ok)]',
  'at-risk': 'bg-[var(--color-warn)]',
  blocked: 'bg-[var(--color-bad)]',
}

function KindTag({ kind, stage }: { kind: Project['kind']; stage: string }) {
  return (
    <span className="text-[12.5px] text-[var(--color-muted)]">
      <span className={kind === 'product' ? 'text-fg-2' : ''}>{kind === 'product' ? 'Product' : 'In testing'}</span> · {stage}
    </span>
  )
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <Link to={`/projects/${p.id}`} className="card lift group flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] font-mono text-[11.5px] font-semibold text-fg-2">
            {p.code}
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-fg">{p.name}</h3>
            <div className="mt-0.5">
              <KindTag kind={p.kind} stage={p.stage} />
            </div>
          </div>
        </div>
        <StatusPill status={p.status} />
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-fg-2">{p.summary}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-medium text-[var(--color-muted)]">
          <span>Progress</span>
          <span className="font-mono text-fg">{p.progress}%</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
          <div className={`h-full rounded-full ${barColor[p.status]}`} style={{ width: `${p.progress}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs">
        <span className="text-[var(--color-muted)]">
          {p.team} · {p.lead}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-fg">
          <span className="font-mono text-[var(--color-muted)]">{p.gate}</span>
          <ArrowRightIcon width={14} height={14} className="text-dim transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

export default function Projects() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Projects"
        title="Project portfolio"
        subtitle="Six base projects run the company — three shipped products and three explorations in testing."
      />

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="eyebrow">Products</span>
          <span className="font-mono text-xs text-dim">{productProjects.length} live</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {productProjects.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="eyebrow">In testing</span>
          <span className="font-mono text-xs text-dim">{explorationProjects.length} exploring</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {explorationProjects.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </div>
  )
}
