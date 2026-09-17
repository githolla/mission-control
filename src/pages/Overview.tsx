import { Link, useNavigate } from 'react-router-dom'
import { user, today, brief, focus, stats, teams, crossTeamDependency, decisions, activity } from '../data'
import { Card, StatIcon, TeamIcon, StatusPill, PriorityPill, ActivityIcon } from '../components/ui'
import { SparkleIcon, PlayIcon, ChatIcon, LinkIcon, BranchIcon, CalendarIcon, ArrowRightIcon } from '../components/icons'
import { useToast } from '../components/Toast'
import AskBar from '../components/AskBar'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const toneStyles: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-600',
  amber: 'bg-amber-50 text-amber-600',
}

export default function Overview() {
  const { notify } = useToast()
  const navigate = useNavigate()
  const overviewDecisions = decisions.slice(0, 2)

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink-900 sm:text-[2.75rem]">
            {greeting()}, {user.firstName}.
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {today.weekday}, {today.date}
          </p>
        </div>
        <p className="max-w-xs pt-2 text-right font-display text-sm italic text-slate-500">
          “{user.quote}”
          <span className="mt-1 block text-[11px] font-semibold not-italic uppercase tracking-wider text-slate-400">
            — {user.name}
          </span>
        </p>
      </div>

      {/* AI morning brief hero */}
      <div className="relative overflow-hidden rounded-3xl bg-ink-950 text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 130% at 85% 120%, rgba(255,168,76,0.45) 0%, rgba(47,107,255,0.18) 34%, rgba(6,13,26,0) 62%), radial-gradient(60% 80% at 78% 30%, rgba(47,107,255,0.22) 0%, rgba(6,13,26,0) 70%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent), radial-gradient(1px 1px at 60% 20%, #cbd5e1 50%, transparent), radial-gradient(1px 1px at 75% 55%, #fff 50%, transparent), radial-gradient(1px 1px at 40% 70%, #94a3b8 50%, transparent), radial-gradient(1px 1px at 88% 42%, #fff 50%, transparent)',
          }}
        />
        <div className="relative grid gap-8 p-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="flex items-center gap-3 text-brand-100">
              <SparkleIcon width={18} height={18} className="text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">AI Morning Brief</span>
              <span className="text-xs font-medium text-slate-400">Updated {today.briefUpdated}</span>
            </div>
            <h2 className="mt-5 max-w-xl font-display text-3xl font-bold leading-tight sm:text-[2.1rem]">
              {brief.headline}
            </h2>
            <div className="mt-4 max-w-xl space-y-3 text-sm leading-relaxed text-slate-300">
              {brief.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => notify('Playing your 2-minute audio briefing…')}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-500"
              >
                <PlayIcon width={15} height={15} />
                Play 2-min briefing
              </button>
              <button
                onClick={() =>
                  document.getElementById('ask-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <ChatIcon width={16} height={16} />
                Ask about today
              </button>
            </div>
          </div>

          <div className="relative flex flex-col justify-between border-white/10 lg:border-l lg:pl-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Your focus today</div>
              <ol className="mt-4 space-y-4">
                {focus.map((f) => (
                  <li key={f.n}>
                    <button
                      onClick={() => navigate('/decisions')}
                      className="group flex w-full items-center gap-4 text-left"
                    >
                      <span className="font-display text-2xl font-bold text-brand-500">{f.n}</span>
                      <span className="text-[15px] font-medium text-slate-100 transition-colors group-hover:text-white">
                        {f.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-8 text-right text-[10px] font-semibold uppercase leading-relaxed tracking-[0.2em] text-slate-500">
              Bigger
              <br />
              People solve
              <br />
              Bigger things
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneStyles[s.tone]}`}>
                <StatIcon name={s.icon} width={20} height={20} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-500">{s.label}</div>
                <div className="mt-0.5 font-display text-3xl font-bold text-ink-900">{s.value}</div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">{s.detail}</p>
          </Card>
        ))}
      </div>

      {/* Company overview + Decisions */}
      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        {/* Company overview */}
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900">Company overview</h2>
            <p className="mt-1 text-sm text-slate-500">Team signals roll up to your view.</p>
          </div>

          <Card className="flex flex-wrap items-center gap-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
                {user.initials}
              </span>
              <div className="text-sm">
                <span className="font-semibold text-ink-900">Director</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-slate-600">{user.name}</span>
              </div>
            </div>
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />
            <p className="text-sm text-slate-500">{user.mandate}</p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            {teams.map((t) => (
              <Link
                key={t.id}
                to={`/teams#${t.id}`}
                className="group block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,30,53,0.04)] transition-shadow hover:shadow-[0_8px_24px_-14px_rgba(15,30,53,0.28)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <TeamIcon name={t.icon} width={19} height={19} />
                  </span>
                  <StatusPill status={t.status} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{t.name}</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Lead: <span className="font-medium text-slate-600">{t.lead}</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{t.summary}</p>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-2.5">
                  <SparkleIcon width={15} height={15} className="mt-0.5 shrink-0 text-brand-500" />
                  <p className="text-xs leading-relaxed text-slate-500">
                    <span className="font-semibold text-slate-700">AI insight:</span> {t.insight}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <Card className="flex flex-wrap items-center justify-between gap-4 border-brand-100 bg-brand-50/60 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                <LinkIcon width={18} height={18} />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink-900">{crossTeamDependency.title}</div>
                <p className="mt-0.5 text-sm text-slate-600">{crossTeamDependency.detail}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/decisions')}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              Review proposed schedule
              <ArrowRightIcon width={16} height={16} />
            </button>
          </Card>
        </section>

        {/* Decisions for you */}
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900">Decisions for you</h2>
            <p className="mt-1 text-sm text-slate-500">2 items need your decision.</p>
          </div>

          {overviewDecisions.map((d) => {
            const Icon = d.icon === 'branch' ? BranchIcon : CalendarIcon
            return (
              <Card key={d.id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon width={20} height={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-ink-900">{d.title}</h3>
                      <PriorityPill priority={d.priority} />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{d.summary}</p>
                    {d.id === 'd-supplier' && (
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                        <span className="font-semibold text-slate-700">AI recommendation:</span> {d.recommendation}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate('/decisions')}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
                  >
                    {d.primaryCta}
                  </button>
                  <button
                    onClick={() => notify(`Opening evidence for “${d.title}”.`)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {d.secondaryCta}
                  </button>
                </div>
              </Card>
            )
          })}
        </section>
      </div>

      {/* AI activity latest */}
      <Card className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <SparkleIcon width={18} height={18} className="text-brand-600" />
          <span className="text-sm font-semibold text-ink-900">AI activity</span>
          <span className="text-sm text-slate-400">(latest)</span>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2">
          {activity.slice(0, 3).map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-sm text-slate-600">
              <ActivityIcon name={a.icon} width={16} height={16} className="text-slate-400" />
              {a.title}
            </div>
          ))}
        </div>
        <Link
          to="/ai-activity"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          View all activity
          <ArrowRightIcon width={16} height={16} />
        </Link>
      </Card>

      {/* Ask bar */}
      <div id="ask-anchor" className="scroll-mt-24">
        <AskBar />
      </div>
    </div>
  )
}
