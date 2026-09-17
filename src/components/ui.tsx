import type { ReactNode, SVGProps } from 'react'
import type { Status } from '../data'
import { GearIcon, RocketIcon, ChartIcon, FileIcon, AlertIcon, UsersIcon, SparkleIcon, ChatIcon, TargetIcon, ClockIcon } from './icons'

type IconProps = SVGProps<SVGSVGElement>

const statusMeta: Record<Status, { label: string; dot: string }> = {
  'on-track': { label: 'On track', dot: 'bg-[var(--color-ok)]' },
  'at-risk': { label: 'At risk', dot: 'bg-[var(--color-warn)]' },
  blocked: { label: 'Blocked', dot: 'bg-[var(--color-bad)]' },
}

export function StatusPill({ status }: { status: Status }) {
  const s = statusMeta[status]
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-700">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function PriorityPill({ priority }: { priority: 'high' | 'normal' }) {
  if (priority !== 'high') return null
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-bad)]/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-bad)]">
      High priority
    </span>
  )
}

const teamIcons = { gear: GearIcon, rocket: RocketIcon, chart: ChartIcon }
export function TeamIcon({ name, ...rest }: { name: 'gear' | 'rocket' | 'chart' } & IconProps) {
  const Icon = teamIcons[name]
  return <Icon {...rest} />
}

const activityIcons = { file: FileIcon, alert: AlertIcon, users: UsersIcon, sparkle: SparkleIcon, chat: ChatIcon }
export function ActivityIcon({ name, ...rest }: { name: keyof typeof activityIcons } & IconProps) {
  const Icon = activityIcons[name]
  return <Icon {...rest} />
}

const statIcons = { target: TargetIcon, file: FileIcon, alert: AlertIcon, clock: ClockIcon }
export function StatIcon({ name, ...rest }: { name: keyof typeof statIcons } & IconProps) {
  const Icon = statIcons[name]
  return <Icon {...rest} />
}

/** A restrained, monochrome icon tile — thin hairline square, no fill colour. */
export function IconTile({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-lg border border-line text-ink-700 ${className}`}
    >
      {children}
    </span>
  )
}

export function Card({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`card ${className}`}>
      {children}
    </div>
  )
}

export function SectionHeading({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <div>
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h2 className="font-display text-2xl font-semibold text-ink-900">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-[var(--color-muted)]">{subtitle}</p>}
    </div>
  )
}
