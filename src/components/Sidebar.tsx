import { NavLink } from 'react-router-dom'
import { HomeIcon, RocketIcon, UsersIcon, FileIcon, SparkleIcon, BookIcon, StarIcon } from './icons'
import { user } from '../data'

const nav = [
  { to: '/', label: 'Overview', Icon: HomeIcon, end: true },
  { to: '/missions', label: 'Missions', Icon: RocketIcon },
  { to: '/teams', label: 'Teams', Icon: UsersIcon },
  { to: '/decisions', label: 'Decisions', Icon: FileIcon, badge: 3 },
  { to: '/ai-activity', label: 'AI Activity', Icon: SparkleIcon },
  { to: '/knowledge', label: 'Knowledge', Icon: BookIcon },
]

export default function Sidebar() {
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-white/5 bg-ink-950 text-slate-400">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 pb-8 pt-7">
        <StarIcon width={22} height={22} className="text-white" />
        <div className="leading-none">
          <div className="font-display text-[13px] font-semibold tracking-[0.22em] text-white">
            MISSION
          </div>
          <div className="mt-1 font-display text-[13px] font-semibold tracking-[0.22em] text-white">
            CONTROL
          </div>
          <div className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Company intelligence
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {nav.map(({ to, label, Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium tracking-tight transition-colors ${
                isActive ? 'bg-white/[0.06] text-white' : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white" />}
                <Icon width={18} height={18} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-white/20 px-1.5 text-[11px] font-semibold text-slate-200">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile */}
      <div className="mx-3 mb-5 mt-4 flex items-center gap-3 border-t border-white/5 px-3 pt-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold tracking-wide text-white">
          {user.initials}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] font-medium text-white">{user.name}</div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{user.role}</div>
        </div>
      </div>
    </aside>
  )
}
