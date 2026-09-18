import { NavLink } from 'react-router-dom'
import { HomeIcon, GridIcon, RocketIcon, UsersIcon, FileIcon, SparkleIcon, BookIcon, StarIcon } from './icons'
import { user, flightReadiness } from '../data'

const nav = [
  { to: '/', label: 'Overview', Icon: HomeIcon, end: true, group: 'Command' },
  { to: '/projects', label: 'Projects', Icon: GridIcon, group: 'Command' },
  { to: '/missions', label: 'Missions', Icon: RocketIcon, group: 'Command' },
  { to: '/teams', label: 'Teams', Icon: UsersIcon, group: 'Command' },
  { to: '/decisions', label: 'Decisions', Icon: FileIcon, badge: 3, group: 'Command' },
  { to: '/ai-activity', label: 'AI Activity', Icon: SparkleIcon, group: 'Intelligence' },
  { to: '/knowledge', label: 'Knowledge', Icon: BookIcon, group: 'Intelligence' },
]

const groups = ['Command', 'Intelligence']

export default function Sidebar() {
  const noGo = flightReadiness.filter((r) => r.status === 'no-go').length
  const allGo = noGo === 0

  return (
    <aside className="relative flex h-full w-[232px] shrink-0 flex-col border-r border-white/[0.06] bg-gradient-to-b from-[#12141b] via-ink-950 to-[#08090e] text-slate-400">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 pb-7 pt-7">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white">
          <StarIcon width={20} height={20} />
        </span>
        <div className="leading-none">
          <div className="font-display text-[13px] font-semibold tracking-[0.2em] text-white">MISSION</div>
          <div className="mt-1 font-display text-[13px] font-semibold tracking-[0.2em] text-white">CONTROL</div>
          <div className="mt-2 text-[9.5px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Company intelligence
          </div>
        </div>
      </div>

      {/* Nav, grouped */}
      <nav className="flex-1 space-y-5 px-3">
        {groups.map((g) => (
          <div key={g}>
            <div className="mb-1.5 px-3 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-slate-600">{g}</div>
            <div className="space-y-0.5">
              {nav
                .filter((n) => n.group === g)
                .map(({ to, label, Icon, end, badge }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium tracking-tight transition-colors ${
                        isActive
                          ? 'bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                          : 'text-slate-400 hover:bg-white/[0.035] hover:text-slate-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white" />
                        )}
                        <Icon width={18} height={18} className="shrink-0" />
                        <span className="flex-1">{label}</span>
                        {badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-white/20 px-1.5 font-mono text-[10px] font-semibold text-slate-200">
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Systems status */}
      <div className="mx-4 mb-3 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${allGo ? 'animate-ping bg-[var(--color-ok)]' : 'bg-[var(--color-warn)]'}`}
          />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${allGo ? 'bg-[var(--color-ok)]' : 'bg-[var(--color-warn)]'}`} />
        </span>
        <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {allGo ? 'All systems nominal' : `${noGo} off-nominal`}
        </span>
        <span className="ml-auto font-mono text-[10px] font-medium text-slate-500">{allGo ? 'GO' : 'HOLD'}</span>
      </div>

      {/* Profile */}
      <div className="mx-3 mb-5 flex items-start gap-3 border-t border-white/[0.06] px-3 pt-4">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/5 text-xs font-semibold tracking-wide text-white ring-1 ring-white/10">
          {user.initials}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] font-medium text-white">{user.name}</div>
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-slate-500">{user.console}</div>
          <div className="mt-1 text-[10px] leading-snug tracking-[0.02em] text-slate-600">{user.background}</div>
        </div>
      </div>
    </aside>
  )
}
