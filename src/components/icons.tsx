import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
})

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </svg>
)

export const RocketIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 15c-1.5 1-2 4-2 4s3-.5 4-2c.5-.8.5-1.7 0-2.2s-1.4-.5-2 .2Z" />
    <path d="M9 15l-3-3c1-4 4-8 9-9 1 5-3 8-6 9Z" />
    <path d="M14.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    <path d="M9 12l-3 3M12 9l3-3" opacity="0" />
  </svg>
)

export const UsersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
    <circle cx="9.5" cy="7.5" r="3" />
    <path d="M21 20v-1.5a4 4 0 0 0-3-3.87" />
    <path d="M15 4.13a3 3 0 0 1 0 5.75" />
  </svg>
)

export const FileIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 16h4" />
  </svg>
)

export const SparkleIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9Z" />
    <path d="M18.5 4.5 19 6.2 20.7 6.7 19 7.2 18.5 8.9 18 7.2 16.3 6.7 18 6.2Z" />
  </svg>
)

export const BookIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5Z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5Z" />
  </svg>
)

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const TargetIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" />
  </svg>
)

export const AlertIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10.3 4 3.4 16a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4.5M12 17h.01" />
  </svg>
)

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.5l3 1.8" />
  </svg>
)

export const PlayIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
  </svg>
)

export const ChatIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 15.5A2.5 2.5 0 0 1 17.5 18H8l-4 3V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5Z" />
  </svg>
)

export const LinkIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9.5 14.5 14.5 9.5" />
    <path d="M8 12 6 14a3.5 3.5 0 0 0 5 5l2-2" />
    <path d="M16 12l2-2a3.5 3.5 0 0 0-5-5l-2 2" />
  </svg>
)

export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M4 9h16M8 3v4M16 3v4" />
  </svg>
)

export const BranchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="6" cy="6" r="2.2" />
    <circle cx="18" cy="8" r="2.2" />
    <circle cx="12" cy="18" r="2.2" />
    <path d="M6 8.2v3.3a2.5 2.5 0 0 0 2.5 2.5H10M16.5 9.6 13.6 16" />
  </svg>
)

export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const SendIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12 20 4l-4 16-4-7-8-1Z" />
  </svg>
)

export const GearIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
  </svg>
)

export const ChartIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" opacity="0" />
    <path d="M4 20h16" />
    <rect x="5" y="12" width="3" height="6" rx="0.6" fill="currentColor" stroke="none" />
    <rect x="10.5" y="8" width="3" height="10" rx="0.6" fill="currentColor" stroke="none" />
    <rect x="16" y="5" width="3" height="13" rx="0.6" fill="currentColor" stroke="none" />
  </svg>
)

export const StarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2.5c.4 4.6 1.9 6.1 6.5 6.5-4.6.4-6.1 1.9-6.5 6.5-.4-4.6-1.9-6.1-6.5-6.5C10.1 8.6 11.6 7.1 12 2.5Z" />
    <path d="M18.5 14.5c.2 2.3 1 3 3.3 3.2-2.3.2-3.1 1-3.3 3.3-.2-2.3-1-3.1-3.2-3.3 2.2-.2 3-1 3.2-3.2Z" />
  </svg>
)

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12.5 9 17.5 20 6.5" />
  </svg>
)

export const BellIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" />
    <path d="M10.5 20a2 2 0 0 0 3 0" />
  </svg>
)
