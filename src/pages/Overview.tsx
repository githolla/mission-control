import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  user,
  today,
  brief,
  focus,
  stats,
  teams,
  crossTeamDependency,
  decisions,
  activity,
  projects,
  productProjects,
  explorationProjects,
} from '../data'
import { Card, StatIcon, TeamIcon, StatusPill, PriorityPill, ActivityIcon, IconTile } from '../components/ui'
import { SparkleIcon, ChatIcon, LinkIcon, BranchIcon, CalendarIcon, ArrowRightIcon } from '../components/icons'
import { useToast } from '../components/Toast'
import { MissionClock, ReadinessBoard } from '../components/mission'
import Greeting from '../components/Greeting'
import Copilot from '../components/Copilot'
import AskBar from '../components/AskBar'
import ChatModal from '../components/ChatModal'
import Planet from '../components/Planet'

export default function Overview() {
  const { notify } = useToast()
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)
  const overviewDecisions = decisions

  return (
    <div className="space-y-8">
      {/* Full-bleed space hero — greeting, clock, brief and focus over the planet */}
      <div className="relative -mx-8 -mt-8 overflow-hidden bg-ink-950 text-white xl:-mx-12">
        {/* Deep space: starfield + a live, lit planet rising over the horizon */}
        <div className="stars pointer-events-none absolute inset-0 opacity-80" />
        <Planet
          className="pointer-events-none absolute left-1/2 top-[56%] h-[1800px] w-[1800px] max-w-none -translate-x-[46%]"
          radius={0.44}
          light={[0.2, 0.8, 0.5]}
        />
        {/* Legibility overlays: darken the left where the copy sits, let the planet breathe on the right */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(6,10,18,0.94) 0%, rgba(6,10,18,0.72) 36%, rgba(6,10,18,0.16) 60%, rgba(6,10,18,0) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          style={{ background: 'linear-gradient(180deg, rgba(6,10,18,0.7) 0%, rgba(6,10,18,0) 100%)' }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{ background: 'linear-gradient(0deg, rgba(6,10,18,1) 0%, rgba(6,10,18,0) 100%)' }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{ background: 'radial-gradient(110% 90% at 100% 0%, rgba(6,10,18,0.7) 0%, rgba(6,10,18,0) 50%)' }}
        />

        <div className="relative px-8 pb-28 pt-9 sm:px-12 sm:pb-36 sm:pt-10 xl:px-14">
          <Greeting onDark />

          <div className="mt-9 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <div>
            <div className="flex items-center gap-3">
              <SparkleIcon width={15} height={15} className="text-white" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fg-2">
                AI Morning Brief
              </span>
              <span className="h-3 w-px bg-white/20" />
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dim">
                Updated {today.briefUpdated}
              </span>
            </div>
            <Link
              to={brief.headlineTo}
              className="group mt-6 block max-w-xl font-display text-[1.9rem] font-semibold leading-[1.15] tracking-tight sm:text-[2.15rem]"
            >
              <span className="bg-gradient-to-r from-white to-white bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
                {brief.headline}
              </span>
              <ArrowRightIcon
                width={22}
                height={22}
                className="ml-2 inline-block -translate-y-0.5 text-dim opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white group-hover:opacity-100"
              />
            </Link>
            <div className="mt-4 max-w-xl space-y-1">
              {brief.paragraphs.map((p, i) => (
                <Link
                  key={i}
                  to={p.to}
                  className="group -mx-2 flex items-start gap-3 rounded-lg px-2 py-2 text-sm leading-relaxed text-fg-3 transition-colors hover:bg-white/[0.06] hover:text-fg"
                >
                  <span className="flex-1">{p.text}</span>
                  <span className="mt-0.5 flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.08em] text-dim opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowRightIcon width={14} height={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <button
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center gap-2 rounded-[4px] bg-invert px-4 py-2.5 text-sm font-medium text-on-invert transition-colors hover:bg-white"
              >
                <ChatIcon width={16} height={16} />
                Ask about today
              </button>
            </div>
          </div>

          <div className="relative rounded-xl border border-white/10 bg-[rgba(6,10,18,0.55)] p-6 backdrop-blur-md">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fg-3">
                Your focus today
              </div>
              <div className="mt-4 -mx-2">
                {focus.map((f) => (
                  <button
                    key={f.n}
                    onClick={() => navigate(f.to)}
                    className="group flex w-full items-center gap-4 rounded-lg border-t border-white/10 px-2 py-3.5 text-left transition-colors first:border-t-0 hover:bg-white/5"
                  >
                    <span className="font-display text-lg font-medium tabular-nums text-fg-3">{f.n}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium text-white">{f.label}</span>
                      <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.1em] text-fg-3">
                        {f.hint}
                      </span>
                    </span>
                    <ArrowRightIcon
                      width={16}
                      height={16}
                      className="shrink-0 text-fg-3 transition-all group-hover:translate-x-0.5 group-hover:text-white"
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
      <div className="rise" style={{ animationDelay: '80ms' }}><MissionClock /></div>

      {/* KPI cards */}
      <div className="rise grid gap-4 sm:grid-cols-2 xl:grid-cols-4" style={{ animationDelay: '160ms' }}>
        {stats.map((s) => {
          const arrow = s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : '→'
          const trendColor = s.trend === 'flat' ? 'text-[var(--color-muted)]' : 'text-[var(--color-ok)]'
          return (
            <Link key={s.id} to={s.to} className="card lift group block p-5">
              <div className="flex items-center justify-between">
                <span className="eyebrow" style={{ color: 'var(--color-sky)' }}>{s.label}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-dim transition-colors group-hover:text-fg-3">
                  <StatIcon name={s.icon} width={15} height={15} />
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <div className="font-display text-[2.1rem] font-semibold leading-none tracking-tight" style={{ color: 'var(--color-amber)' }}>{s.value}</div>
                <span className={`mb-0.5 inline-flex items-center gap-1 font-mono text-[11px] font-medium ${trendColor}`}>
                  {arrow} {s.delta}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">{s.detail}</p>
            </Link>
          )
        })}
      </div>

      {/* Project portfolio — the six base projects */}
      <section className="rise space-y-4" style={{ animationDelay: '240ms' }}>
        <div className="flex items-end justify-between">
          <div>
            <div className="eyebrow mb-2">Project portfolio</div>
            <p className="text-sm text-[var(--color-muted)]">
              {productProjects.length} products live · {explorationProjects.length} in testing.
            </p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-fg hover:text-white"
          >
            View portfolio
            <ArrowRightIcon width={15} height={15} />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card lift group flex items-center gap-3.5 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line font-mono text-[12px] font-semibold text-fg-2">
                {p.code}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-fg">{p.name}</span>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      background:
                        p.status === 'on-track'
                          ? 'var(--color-ok)'
                          : p.status === 'at-risk'
                            ? 'var(--color-warn)'
                            : 'var(--color-bad)',
                    }}
                  />
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]">
                  <span className={p.kind === 'product' ? 'text-fg-3' : 'text-[var(--color-muted)]'}>
                    {p.kind === 'product' ? 'Product' : 'In testing'}
                  </span>
                  <span className="text-fg-3">·</span>
                  <span className="truncate text-[var(--color-muted)]">{p.stage}</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${p.progress}%`,
                      background:
                        p.status === 'on-track'
                          ? 'var(--color-ok)'
                          : p.status === 'at-risk'
                            ? 'var(--color-warn)'
                            : 'var(--color-bad)',
                    }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-invert text-[11px] font-semibold text-on-invert">
                {user.initials}
              </span>
              <span className="text-sm">
                <span className="font-semibold text-fg">{user.role}</span>
                <span className="mx-2 text-fg-3">·</span>
                <span className="text-[var(--color-muted)]">{user.name}</span>
              </span>
            </div>
            <span className="hidden text-sm text-[var(--color-muted)] sm:inline">— {user.mandate}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {teams.map((t) => (
              <Link key={t.id} to={`/teams#${t.id}`} className="card lift group block p-5">
                <div className="flex items-center justify-between">
                  <IconTile className="h-9 w-9">
                    <TeamIcon name={t.icon} width={18} height={18} />
                  </IconTile>
                  <StatusPill status={t.status} />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-fg">{t.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-dim">{t.lead}</p>
                <p className="mt-3 text-sm leading-relaxed text-fg-2">{t.summary}</p>
                <div className="mt-4 border-l-2 border-line pl-3">
                  <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                    <span className="font-semibold text-fg-3">AI insight</span> — {t.insight}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5">
            <div className="flex items-start gap-3">
              <IconTile className="h-9 w-9 shrink-0">
                <LinkIcon width={17} height={17} />
              </IconTile>
              <div>
                <div className="text-sm font-semibold text-fg">{crossTeamDependency.title}</div>
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
                      <h3 className="font-display text-base font-semibold text-fg">{d.title}</h3>
                      <PriorityPill priority={d.priority} />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{d.summary}</p>
                    {d.id === 'd-supplier' && (
                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                        <span className="font-semibold text-fg-3">AI recommendation</span> — {d.recommendation}
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
          <SparkleIcon width={16} height={16} className="text-fg-3" />
          <span className="eyebrow">AI activity</span>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2">
          {activity.slice(0, 3).map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-sm text-fg-2">
              <ActivityIcon name={a.icon} width={15} height={15} className="text-dim" />
              {a.title}
            </div>
          ))}
        </div>
        <Link
          to="/ai-activity"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg hover:text-white"
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
