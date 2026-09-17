import type { ReactNode, SVGProps } from 'react'
import type { Status } from '../data'
import { GearIcon, RocketIcon, ChartIcon, FileIcon, AlertIcon, UsersIcon, SparkleIcon, ChatIcon, TargetIcon, ClockIcon } from './icons'

type IconProps = SVGProps<SVGSVGElement>

export function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    'on-track': { label: 'On track', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    'at-risk': { label: 'At risk', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    blocked: { label: 'Blocked', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.cls}`}>
      {s.label}
    </span>
  )
}

export function PriorityPill({ priority }: { priority: 'high' | 'normal' }) {
  if (priority !== 'high') return null
  return (
    <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
      High priority
    </span>
  )
}

const teamIcons = {
  gear: GearIcon,
  rocket: RocketIcon,
  chart: ChartIcon,
}
export function TeamIcon({ name, ...rest }: { name: 'gear' | 'rocket' | 'chart' } & IconProps) {
  const Icon = teamIcons[name]
  return <Icon {...rest} />
}

const activityIcons = {
  file: FileIcon,
  alert: AlertIcon,
  users: UsersIcon,
  sparkle: SparkleIcon,
  chat: ChatIcon,
}
export function ActivityIcon({ name, ...rest }: { name: keyof typeof activityIcons } & IconProps) {
  const Icon = activityIcons[name]
  return <Icon {...rest} />
}

const statIcons = { target: TargetIcon, file: FileIcon, alert: AlertIcon, clock: ClockIcon }
export function StatIcon({ name, ...rest }: { name: keyof typeof statIcons } & IconProps) {
  const Icon = statIcons[name]
  return <Icon {...rest} />
}

export function Card({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,30,53,0.04),0_8px_24px_-16px_rgba(15,30,53,0.18)] ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-ink-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  )
}
