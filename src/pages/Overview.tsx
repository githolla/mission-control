import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { user, today, brief, focus, stats, teams, crossTeamDependency, decisions, activity } from '../data'
import { Card, StatIcon, TeamIcon, StatusPill, PriorityPill, ActivityIcon, IconTile } from '../components/ui'
import { SparkleIcon, ChatIcon, LinkIcon, BranchIcon, CalendarIcon, ArrowRightIcon } from '../components/icons'
import { useToast } from '../components/Toast'
import { MissionClock, ReadinessBoard } from '../components/mission'
import Greeting from '../components/Greeting'
import Copilot from '../components/Copilot'
import AskBar from '../components/AskBar'
import ChatModal from '../components/ChatModal'

export default function Overview() {
  const { notify } = useToast()
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)
  const overviewDecisions = decisions

  return (
    <div className="space-y-8">
      {/* Full-bleed space hero — greeting, clock, brief and focus over the planet */}
      <div className="relative -mx-8 -mt-8 overflow-hidden bg-ink-950 text-white xl:-mx-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'url(/hero-space.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
          }}
        />
        {/* Legibility overlay: darkens the left where the copy sits, lets the planet breathe on the right */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(6,8,13,0.95) 0%, rgba(6,8,13,0.82) 40%, rgba(6,8,13,0.42) 64%, rgba(6,8,13,0.12) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          style={{ background: 'linear-gradient(180deg, rgba(6,8,13,0.7) 0%, rgba(6,8,13,0) 100%)' }}
        />
        {/* Scrim behind the focus list (top-right) for legibility over the bright limb */}
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{ background: 'radial-gradient(120% 95% at 100% 0%, rgba(6,8,13,0.62) 0%, rgba(6,8,13,0) 52%)' }}
        />

        <div className="relative px-8 pb-10 pt-9 sm:px-12 sm:pb-12 sm:pt-10 xl:px-14">
          <Greeting onDark />

          <div className="mt-9 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div>
            <div className="flex items-center gap-3">
              <SparkleIcon width={15} height={15} className="text-white" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                AI Morning Brief
              </span>
              <span className="h-3 w-px bg-white/20" />
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Updated {today.briefUpdated}
              </span>
            </div>
            <h2 className="mt-6 max-w-xl font-display text-[1.9rem] font-semibold leading-[1.15] tracking-tight sm:text-[2.15rem]">
              {brief.headline}
            </h2>
            <div className="mt-4 max-w-xl space-y-2.5 text-sm leading-relaxed text-slate-300">
              {brief.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-8">
              <button
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-slate-200"
              >
                <ChatIcon width={16} height={16} />
                Ask about today
              </button>
            </div>
          </div>

          <div className="relative lg:border-l lg:border-white/10 lg:pl-8">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                Your focus today
              </div>
              <div className="mt-4 -mx-2">
                {focus.map((f) => (
                  <button
                    key={f.n}
                    onClick={() => navigate(f.to)}
                    className="group flex w-full items-center gap-4 rounded-lg border-t border-white/10 px-2 py-3.5 text-left transition-colors first:border-t-0 hover:bg-white/5"
                  >
                    <span className="font-display text-lg font-medium tabular-nums text-slate-300">{f.n}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium text-white">{f.label}</span>
                      <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.1em] text-slate-300">
                        {f.hint}
                      </span>
                    </span>
                    <ArrowRightIcon
                      width={16}
                      height={16}
                      className="shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-white"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Mission clock — T-minus to the nearest gate */}
      <MissionClock />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.id} to={s.to} className="card group block p-5 transition-colors hover:border-line-strong">
            <div className="flex items-center justify-between">
              <span className="eyebrow">{s.label}</span>
              <StatIcon name={s.icon} width={17} height={17} className="text-slate-400" />
            </div>
            <div className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-ink-900">{s.value}</div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">{s.detail}</p>
          </Link>
        ))}
      </div>

      {/* AI Copilot — recommended actions */}
      <Copilot />

      {/* Flight readiness — Go / No-Go poll */}
      <section className="space-y-5">
        <div>
          <div className="eyebrow mb-2">Flight readiness</div>
          <p className="text-sm text-[var(--color-muted)]">Every station polled and rolled up to your console.</p>
        </div>
        <ReadinessBoard />
      </section>

      {/* Company overview + Decisions */}
      <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr]">
        {/* Company overview */}
        <section className="space-y-5">
          <div>
            <div className="eyebrow mb-2">Company overview</div>
            <p className="text-sm text-[var(--color-muted)]">Team signals roll up to your view.</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-white">
                {user.initials}
              </span>
              <span className="text-sm">
                <span className="font-semibold text-ink-900">Director</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-[var(--color-muted)]">{user.name}</span>
              </span>
            </div>
            <span className="hidden text-sm text-[var(--color-muted)] sm:inline">— {user.mandate}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {teams.map((t) => (
              <Link
                key={t.id}
                to={`/teams#${t.id}`}
                className="card group block p-5 transition-colors hover:border-line-strong"
              >
                <div className="flex items-center justify-between">
                  <IconTile className="h-9 w-9">
                    <TeamIcon name={t.icon} width={18} height={18} />
                  </IconTile>
                  <StatusPill status={t.status} />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-ink-900">{t.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-400">{t.lead}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-800">{t.summary}</p>
                <div className="mt-4 border-l-2 border-line pl-3">
                  <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                    <span className="font-semibold text-ink-700">AI insight</span> — {t.insight}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-white p-5">
            <div className="flex items-start gap-3">
              <IconTile className="h-9 w-9 shrink-0">
                <LinkIcon width={17} height={17} />
              </IconTile>
              <div>
                <div className="text-sm font-semibold text-ink-900">{crossTeamDependency.title}</div>
                <p className="mt-0.5 text-sm text-[var(--color-muted)]">{crossTeamDependency.detail}</p>
              </div>
            </div>
            <button onClick={() => navigate('/decisions')} className="btn btn-primary">
              Review schedule
              <ArrowRightIcon width={16} height={16} />
            </button>
          </div>
        </section>

        {/* Decisions for you */}
        <section className="space-y-5">
          <div>
            <div className="eyebrow mb-2">Decisions for you</div>
            <p className="text-sm text-[var(--color-muted)]">{overviewDecisions.length} items need your decision.</p>
          </div>

          {overviewDecisions.map((d) => {
            const Icon = d.icon === 'branch' ? BranchIcon : CalendarIcon
            return (
              <Card key={d.id} className="p-5">
                <div className="flex items-start gap-3">
                  <IconTile className="h-9 w-9 shrink-0">
                    <Icon width={18} height={18} />
                  </IconTile>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-ink-900">{d.title}</h3>
                      <PriorityPill priority={d.priority} />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-800">{d.summary}</p>
                    {d.id === 'd-supplier' && (
                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                        <span className="font-semibold text-ink-700">AI recommendation</span> — {d.recommendation}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => navigate('/decisions')} className="btn btn-primary">
                    {d.primaryCta}
                  </button>
                  <button onClick={() => notify(`Opening evidence for “${d.title}”.`)} className="btn btn-secondary">
                    {d.secondaryCta}
                  </button>
                </div>
              </Card>
            )
          })}
        </section>
      </div>

      {/* AI activity latest */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-4">
        <div className="flex items-center gap-2">
          <SparkleIcon width={16} height={16} className="text-ink-700" />
          <span className="eyebrow">AI activity</span>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2">
          {activity.slice(0, 3).map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-sm text-ink-800">
              <ActivityIcon name={a.icon} width={15} height={15} className="text-slate-400" />
              {a.title}
            </div>
          ))}
        </div>
        <Link
          to="/ai-activity"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-900 hover:text-black"
        >
          View all
          <ArrowRightIcon width={15} height={15} />
        </Link>
      </div>

      {/* Ask bar */}
      <div id="ask-anchor" className="scroll-mt-24">
        <AskBar />
      </div>

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
