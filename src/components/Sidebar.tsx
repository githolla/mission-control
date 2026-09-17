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
    <aside className="flex h-full w-[208px] shrink-0 flex-col bg-gradient-to-b from-ink-900 via-ink-900 to-ink-950 text-slate-300">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <span className="flex h-9 w-9 items-center justify-center text-brand-500">
          <StarIcon width={30} height={30} />
        </span>
        <div className="leading-tight">
          <div className="font-display text-[15px] font-bold tracking-[0.14em] text-white">
            MISSION
            <br />
            CONTROL
          </div>
          <div className="mt-1 text-[11px] font-medium tracking-wide text-slate-400">Company intelligence</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ to, label, Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon width={19} height={19} className="shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-ink-900">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile */}
      <div className="mx-3 mt-4 flex items-center gap-3 border-t border-white/10 px-2 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white ring-2 ring-white/10">
          {user.initials}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-white">{user.name}</div>
          <div className="text-xs text-slate-400">{user.role}</div>
        </div>
      </div>

      <div className="px-5 pb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Higher insight
          <br />
          A brighter tomorrow
        </div>
      </div>
    </aside>
  )
}
