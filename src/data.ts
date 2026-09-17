// Central demo dataset for Mission Control.
// One coherent narrative shared across every page.

export type Status = 'on-track' | 'at-risk' | 'blocked'

export const user = {
  name: 'Steve MacLean',
  firstName: 'Steve',
  role: 'Director',
  initials: 'SM',
  mandate: 'Setting direction. Removing blockers. Keeping missions on track.',
  quote: 'Complexity is a problem worth solving.',
}

export const today = {
  weekday: 'Thursday',
  date: 'September 17',
  briefUpdated: '07:00',
}

export const stats = [
  {
    id: 'missions',
    label: 'Missions on track',
    value: '8 / 10',
    detail: 'Two missions are at risk, down from three last week.',
    icon: 'target',
    tone: 'brand',
  },
  {
    id: 'decisions',
    label: 'Decisions needed',
    value: '3',
    detail: 'Three items need your decision this week.',
    icon: 'file',
    tone: 'brand',
  },
  {
    id: 'risks',
    label: 'Risks detected',
    value: '2',
    detail: 'Down from 4 last week.',
    icon: 'alert',
    tone: 'amber',
  },
  {
    id: 'hours',
    label: 'Hours saved this week',
    value: '24',
    detail: 'AI has saved you 24 hours across briefings, analysis and draft content.',
    icon: 'clock',
    tone: 'brand',
  },
] as const

export const focus = [
  { n: '01', label: 'Approve recovery plan', to: '/decisions', hint: 'Supplier recovery · protects Oct 10' },
  { n: '02', label: 'Resolve resource conflict', to: '/decisions', hint: 'Engineering allocation · October' },
  { n: '03', label: 'Review partner briefing', to: '/knowledge', hint: 'Partner demo runbook · Oct 6' },
]

export const brief = {
  headline: 'Two priorities need your attention today.',
  paragraphs: [
    'A supplier delay could move the prototype review by 4 days. Engineering has a recovery plan ready for your approval.',
    'Finance and hiring remain on plan. Three team updates are waiting for review.',
  ],
}

export type Team = {
  id: string
  name: string
  lead: string
  status: Status
  icon: 'gear' | 'rocket' | 'chart'
  summary: string
  insight: string
  headcount: number
  missions: number
  metrics: { label: string; value: string }[]
}

export const teams: Team[] = [
  {
    id: 'engineering',
    name: 'Engineering',
    lead: 'Priya Desai',
    status: 'at-risk',
    icon: 'gear',
    summary: 'Supplier delay could move prototype review by 4 days.',
    insight: 'Recovery plan is ready for your approval.',
    headcount: 42,
    missions: 4,
    metrics: [
      { label: 'Velocity', value: '92%' },
      { label: 'Open risks', value: '2' },
      { label: 'Prototype', value: 'Oct 10' },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    lead: 'Marcus Chen',
    status: 'on-track',
    icon: 'rocket',
    summary: 'Manufacturing readiness on schedule for Q4.',
    insight: 'No action needed. Momentum is strong.',
    headcount: 28,
    missions: 3,
    metrics: [
      { label: 'Readiness', value: '96%' },
      { label: 'Open risks', value: '0' },
      { label: 'Q4 gate', value: 'On plan' },
    ],
  },
  {
    id: 'commercial',
    name: 'Commercial',
    lead: 'Elena Park',
    status: 'on-track',
    icon: 'chart',
    summary: 'Partner demo on schedule for October 6.',
    insight: 'Consider aligning resources with engineering (shared team).',
    headcount: 19,
    missions: 3,
    metrics: [
      { label: 'Pipeline', value: '$4.2M' },
      { label: 'Open risks', value: '0' },
      { label: 'Partner demo', value: 'Oct 6' },
    ],
  },
]

export const crossTeamDependency = {
  title: 'AI detected a cross-team dependency',
  detail: 'Prototype testing and the partner demo need the same engineering team.',
}

export type Mission = {
  id: string
  name: string
  team: string
  status: Status
  owner: string
  due: string
  progress: number
  summary: string
}

export const missions: Mission[] = [
  {
    id: 'm-proto',
    name: 'Prototype v2 review',
    team: 'Engineering',
    status: 'at-risk',
    owner: 'Priya Desai',
    due: 'Oct 10',
    progress: 68,
    summary: 'Supplier delay threatens the review date. Recovery plan awaiting approval.',
  },
  {
    id: 'm-mfg',
    name: 'Manufacturing readiness',
    team: 'Operations',
    status: 'on-track',
    owner: 'Marcus Chen',
    due: 'Nov 30',
    progress: 74,
    summary: 'Line qualification proceeding on schedule for the Q4 gate.',
  },
  {
    id: 'm-demo',
    name: 'Partner demo',
    team: 'Commercial',
    status: 'on-track',
    owner: 'Elena Park',
    due: 'Oct 6',
    progress: 81,
    summary: 'Demo environment ready. Final rehearsal scheduled next week.',
  },
  {
    id: 'm-cert',
    name: 'Safety certification',
    team: 'Engineering',
    status: 'at-risk',
    owner: 'Omar Haddad',
    due: 'Dec 15',
    progress: 45,
    summary: 'Awaiting third-party lab slot. Alternate lab under evaluation.',
  },
  {
    id: 'm-hire',
    name: 'Q4 hiring plan',
    team: 'Operations',
    status: 'on-track',
    owner: 'Marcus Chen',
    due: 'Oct 31',
    progress: 60,
    summary: 'Six of ten roles filled. Pipeline healthy for the rest.',
  },
  {
    id: 'm-supply',
    name: 'Supplier diversification',
    team: 'Operations',
    status: 'on-track',
    owner: 'Marcus Chen',
    due: 'Nov 15',
    progress: 52,
    summary: 'Second source qualified for two critical components.',
  },
  {
    id: 'm-brand',
    name: 'Launch brand refresh',
    team: 'Commercial',
    status: 'on-track',
    owner: 'Elena Park',
    due: 'Nov 1',
    progress: 70,
    summary: 'Creative approved. Rollout plan in final review.',
  },
  {
    id: 'm-data',
    name: 'Data platform migration',
    team: 'Engineering',
    status: 'on-track',
    owner: 'Priya Desai',
    due: 'Dec 1',
    progress: 58,
    summary: 'Phase 1 complete. No blockers reported this week.',
  },
  {
    id: 'm-cost',
    name: 'Cost-down program',
    team: 'Operations',
    status: 'on-track',
    owner: 'Marcus Chen',
    due: 'Dec 20',
    progress: 40,
    summary: 'Tracking to 8% unit-cost reduction target.',
  },
  {
    id: 'm-support',
    name: 'Customer support scale-up',
    team: 'Commercial',
    status: 'on-track',
    owner: 'Elena Park',
    due: 'Nov 20',
    progress: 66,
    summary: 'New tooling live. Response times down 30%.',
  },
]

export type Decision = {
  id: string
  title: string
  priority: 'high' | 'normal'
  icon: 'branch' | 'calendar'
  summary: string
  recommendation: string
  options: { label: string; detail: string; recommended?: boolean }[]
  primaryCta: string
  secondaryCta: string
}

export const decisions: Decision[] = [
  {
    id: 'd-supplier',
    title: 'Approve alternate supplier',
    priority: 'high',
    icon: 'branch',
    summary: 'A supplier delay could move the prototype review by 4 days.',
    recommendation: 'switch to protect the review date.',
    options: [
      {
        label: 'Switch to alternate supplier',
        detail: 'Protects the Oct 10 review date. ~3% higher unit cost this batch.',
        recommended: true,
      },
      {
        label: 'Wait for primary supplier',
        detail: 'Keeps current cost. Review slips ~4 days to Oct 14.',
      },
    ],
    primaryCta: 'Review recommendation',
    secondaryCta: 'View evidence',
  },
  {
    id: 'd-allocation',
    title: 'Resolve engineering allocation',
    priority: 'normal',
    icon: 'calendar',
    summary: 'Two teams need the same engineering resources in October.',
    recommendation: 'sequence prototype testing ahead of the partner demo.',
    options: [
      {
        label: 'Prototype first, then demo support',
        detail: 'Protects the certification path. Demo gets 3 engineers from Oct 7.',
        recommended: true,
      },
      {
        label: 'Split the team across both',
        detail: 'Both progress slower. Higher context-switching cost.',
      },
    ],
    primaryCta: 'Review options',
    secondaryCta: 'View details',
  },
  {
    id: 'd-budget',
    title: 'Reallocate Q4 budget',
    priority: 'normal',
    icon: 'calendar',
    summary: 'Certification costs came in above plan. $120K needs a source.',
    recommendation: 'draw from the underspent travel budget.',
    options: [
      {
        label: 'Draw from travel underspend',
        detail: 'No impact to active missions. Travel budget is 40% underspent.',
        recommended: true,
      },
      {
        label: 'Defer brand refresh spend',
        detail: 'Frees $150K but slips the launch brand refresh by a month.',
      },
    ],
    primaryCta: 'Review options',
    secondaryCta: 'View details',
  },
]

export type Activity = {
  id: string
  icon: 'file' | 'alert' | 'users' | 'sparkle' | 'chat'
  title: string
  detail: string
  time: string
}

export const activity: Activity[] = [
  {
    id: 'a1',
    icon: 'file',
    title: 'Drafted your partner briefing',
    detail: 'A one-page briefing for the Oct 6 partner demo is ready for review.',
    time: '07:02',
  },
  {
    id: 'a2',
    icon: 'alert',
    title: 'Flagged supplier delay',
    detail: 'Detected a 4-day slip risk on the prototype review and drafted a recovery plan.',
    time: '06:51',
  },
  {
    id: 'a3',
    icon: 'users',
    title: 'Prepared team follow-ups',
    detail: 'Summarized three team updates and suggested follow-ups for each lead.',
    time: '06:40',
  },
  {
    id: 'a4',
    icon: 'sparkle',
    title: 'Generated the morning brief',
    detail: 'Synthesized 42 signals across Engineering, Operations and Commercial.',
    time: '07:00',
  },
  {
    id: 'a5',
    icon: 'chat',
    title: 'Answered a question on hiring',
    detail: '"Are we on track for Q4 hiring?" — answered from the Operations plan.',
    time: 'Yesterday',
  },
  {
    id: 'a6',
    icon: 'file',
    title: 'Summarized the board pre-read',
    detail: 'Condensed the 18-page pre-read into a 5-point summary with open questions.',
    time: 'Yesterday',
  },
]

export type KnowledgeDoc = {
  id: string
  title: string
  category: string
  updated: string
  summary: string
}

export const knowledge: KnowledgeDoc[] = [
  {
    id: 'k1',
    title: 'Company strategy 2026',
    category: 'Strategy',
    updated: '2 days ago',
    summary: 'The three bets for the year and the metrics that define success.',
  },
  {
    id: 'k2',
    title: 'Prototype v2 spec',
    category: 'Engineering',
    updated: '4 hours ago',
    summary: 'Requirements, test plan and the current supplier dependency map.',
  },
  {
    id: 'k3',
    title: 'Partner demo runbook',
    category: 'Commercial',
    updated: 'Yesterday',
    summary: 'Step-by-step plan for the Oct 6 demo, owners and fallback options.',
  },
  {
    id: 'k4',
    title: 'Q4 operating plan',
    category: 'Operations',
    updated: '1 week ago',
    summary: 'Manufacturing readiness, hiring and the cost-down program targets.',
  },
  {
    id: 'k5',
    title: 'Risk register',
    category: 'Cross-team',
    updated: '1 hour ago',
    summary: 'Live view of open risks, owners and mitigation status.',
  },
  {
    id: 'k6',
    title: 'Board pre-read — September',
    category: 'Leadership',
    updated: '3 days ago',
    summary: 'Progress against the plan, key decisions and asks of the board.',
  },
]

export const suggestedPrompts = [
  'What changed overnight?',
  'Where do I need to step in?',
  'Explain this risk',
]
