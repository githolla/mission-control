import { activity } from '../data'
import { Card, ActivityIcon, SectionHeading } from '../components/ui'

export default function AIActivity() {
  return (
    <div className="space-y-6">
      <SectionHeading
        title="AI Activity"
        subtitle="Everything Mission Control did on your behalf, most recent first."
      />

      <Card className="p-2 sm:p-4">
        <ol className="relative">
          {activity.map((a, i) => (
            <li key={a.id} className="relative flex gap-4 px-3 py-4">
              {i !== activity.length - 1 && (
                <span className="absolute left-[2.15rem] top-14 h-[calc(100%-2rem)] w-px bg-slate-200" aria-hidden />
              )}
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-4 ring-white">
                <ActivityIcon name={a.icon} width={19} height={19} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="text-sm font-semibold text-ink-900">{a.title}</h3>
                  <span className="text-xs font-medium text-slate-400">{a.time}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{a.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
