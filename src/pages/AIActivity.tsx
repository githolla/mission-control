import { activity } from '../data'
import { ActivityIcon, SectionHeading, IconTile } from '../components/ui'

export default function AIActivity() {
  return (
    <div className="space-y-7">
      <SectionHeading
        eyebrow="AI Activity"
        title="Activity log"
        subtitle="Everything Mission Control did on your behalf, most recent first."
      />

      <ol className="relative border-l border-line pl-6">
        {activity.map((a) => (
          <li key={a.id} className="relative pb-7 last:pb-0">
            <span className="absolute -left-[calc(1.5rem+1px)] top-0 flex h-8 w-8 -translate-x-1/2 items-center justify-center">
              <IconTile className="h-8 w-8 bg-[#f4f5f7]">
                <ActivityIcon name={a.icon} width={16} height={16} />
              </IconTile>
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="text-sm font-semibold text-ink-900">{a.title}</h3>
              <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">{a.time}</span>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">{a.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
