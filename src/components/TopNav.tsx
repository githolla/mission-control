import { NavLink, Link } from 'react-router-dom'
import { StarIcon } from './icons'
import { user, flightReadiness } from '../data'

const tabs = [
  { to: '/', label: 'Overview', end: true },
  { to: '/control-room', label: 'Control Room' },
  { to: '/projects', label: 'Projects' },
  { to: '/missions', label: 'Missions' },
  { to: '/teams', label: 'Teams' },
  { to: '/decisions', label: 'Decisions', badge: 3 },
  { to: '/analysis', label: 'AI Analysis' },
  { to: '/ai-activity', label: 'AI Activity' },
  { to: '/knowledge', label: 'Knowledge' },
]

/** Top navigation: brand left, wide tracked uppercase tabs on a hairline, status + profile right. Sits over the hero. */
export default function TopNav() {
  const noGo = flightReadiness.filter((r) => r.status === 'no-go').length
  const allGo = noGo === 0

  return (
    <header
      className="absolute inset-x-0 top-0 z-30 backdrop-blur-[2px]"
      style={{ background: 'linear-gradient(180deg, rgba(6,10,18,0.72) 0%, rgba(6,10,18,0.35) 70%, rgba(6,10,18,0) 100%)' }}
    >
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-8 px-8 xl:px-12">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-white">
            <StarIcon width={18} height={18} />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[13px] font-bold uppercase tracking-[0.3em] text-white">Mission</span>
            <span className="mt-1 block font-display text-[13px] font-bold uppercase tracking-[0.3em] text-white">Control</span>
          </span>
        </Link>

        {/* Tabs */}
        <nav className="ml-auto hidden items-end gap-5 border-b border-white/25 pb-3 lg:flex xl:gap-8">
          {tabs.map(({ to, label, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative whitespace-nowrap font-display text-[10.5px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                  isActive ? 'text-white' : 'text-fg-3 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {badge && <span className="ml-1.5 font-mono text-[9px] text-[var(--color-amber)]">{badge}</span>}
                  {isActive && <span className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-white" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Status + profile */}
        <div className="flex shrink-0 items-center gap-5 pl-2">
          <span className="hidden items-center gap-2 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-3 md:flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${allGo ? 'animate-ping bg-[var(--color-ok)]' : 'bg-[var(--color-warn)]'}`} />
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${allGo ? 'bg-[var(--color-ok)]' : 'bg-[var(--color-warn)]'}`} />
            </span>
            {allGo ? 'GO' : 'HOLD'}
          </span>
          <span className="flex items-center gap-2.5" title={`${user.name} · ${user.console}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-[11px] font-semibold tracking-wide text-white">
              {user.initials}
            </span>
            <span className="hidden leading-tight 2xl:block">
              <span className="block text-[12px] font-medium text-white">{user.name}</span>
              <span className="block text-[9.5px] uppercase tracking-[0.16em] text-fg-3">{user.console}</span>
            </span>
          </span>
        </div>
      </div>
    </header>
  )
}
