// Central demo dataset for Mission Control.
// One coherent narrative shared across every page.

export type Status = 'on-track' | 'at-risk' | 'blocked'

export const user = {
  name: 'Steve MacLean',
  firstName: 'Steve',
  role: 'Director',
  console: 'Director',
  background: 'Infinite Potential Labs',
  initials: 'SM',
  mandate: 'Setting the trajectory. Clearing blockers. Calling Go / No-Go where it counts.',
  quote: 'Complexity is a problem worth solving.',
}

export const today = {
  weekday: 'Thursday',
  date: 'September 17',
  briefUpdated: '07:00',
}

// Upcoming gates (milestones). T-minus is computed in code relative to
// "today" (Sept 17 of the current year) so the countdown always stays correct.
export type Gate = { id: string; label: string; month: number; day: number }

export const gates: Gate[] = [
  { id: 'g-demo', label: 'Partner demo', month: 10, day: 6 },
  { id: 'g-proto', label: 'Prototype v2 review', month: 10, day: 10 },
  { id: 'g-hiring', label: 'Q4 hiring close', month: 10, day: 31 },
  { id: 'g-cert', label: 'Safety certification', month: 12, day: 15 },
]

/** Whole days from the fixed narrative "today" (Sept 17) to a gate this year. */
export function daysToGate(g: Gate, now: Date = new Date()): number {
  const year = now.getFullYear()
  const today = new Date(year, 8, 17) // September 17
  const target = new Date(year, g.month - 1, g.day)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** Gates still ahead of "today", nearest first. */
export function upcomingGates(now: Date = new Date()): (Gate & { tMinus: number })[] {
  return gates
    .map((g) => ({ ...g, tMinus: daysToGate(g, now) }))
    .filter((g) => g.tMinus >= 0)
    .sort((a, b) => a.tMinus - b.tMinus)
}

// Flight readiness — a classic Go / No-Go poll of every domain, rolled up to
// the director's console. NO-GO / WATCH / GO map to the bad/warn/ok hues.
export type Readiness = 'go' | 'watch' | 'no-go'
export type ReadinessItem = { domain: string; status: Readiness; note: string }

export const flightReadiness: ReadinessItem[] = [
  { domain: 'Engineering', status: 'no-go', note: 'Supplier delay — recovery plan awaiting your go.' },
  { domain: 'Operations', status: 'go', note: 'Manufacturing readiness nominal for the Q4 gate.' },
  { domain: 'Commercial', status: 'go', note: 'Partner demo on schedule for Oct 6.' },
  { domain: 'Finance', status: 'go', note: 'On plan; certification overage sourced.' },
  { domain: 'Hiring', status: 'go', note: '6 of 10 Q4 roles filled; pipeline healthy.' },
]

export type Stat = {
  id: string
  label: string
  value: string
  detail: string
  icon: 'target' | 'file' | 'alert' | 'clock'
  to: string
  trend: 'up' | 'down' | 'flat'
  delta: string
  positive: boolean
}

export const stats: Stat[] = [
  {
    id: 'missions',
    label: 'Missions on track',
    value: '8 / 10',
    detail: 'Two missions are at risk, down from three last week.',
    icon: 'target',
    to: '/missions',
    trend: 'up',
    delta: '+1 wk',
    positive: true,
  },
  {
    id: 'decisions',
    label: 'Decisions needed',
    value: '3',
    detail: 'Three items need your decision this week.',
    icon: 'file',
    to: '/decisions',
    trend: 'flat',
    delta: 'this wk',
    positive: true,
  },
  {
    id: 'risks',
    label: 'Open anomalies',
    value: '2',
    detail: 'Two open anomalies, down from four last week.',
    icon: 'alert',
    to: '/missions?status=at-risk',
    trend: 'down',
    delta: '−2 wk',
    positive: true,
  },
  {
    id: 'hours',
    label: 'Hours saved this week',
    value: '24',
    detail: 'AI has saved you 24 hours across briefings, analysis and draft content.',
    icon: 'clock',
    to: '/ai-activity',
    trend: 'up',
    delta: '+6 wk',
    positive: true,
  },
]

export const focus = [
  { n: '01', label: 'Approve recovery plan', to: '/decisions', hint: 'Supplier recovery · protects Oct 10' },
  { n: '02', label: 'Resolve resource conflict', to: '/decisions', hint: 'Engineering allocation · October' },
  { n: '03', label: 'Review partner briefing', to: '/knowledge', hint: 'Partner demo runbook · Oct 6' },
]

export const brief = {
  headline: 'Two priorities need your attention today.',
  headlineTo: '/decisions',
  paragraphs: [
    {
      text: 'A supplier delay has taken the prototype review off-nominal — the date could slip 4 days. Engineering has a recovery plan ready for your go.',
      to: '/missions/m-proto',
      cue: 'Open the prototype mission',
    },
    {
      text: 'All other stations are nominal. Finance and hiring remain on plan, and three team updates are waiting for your review.',
      to: '/teams',
      cue: 'Review team updates',
    },
  ],
}

export type Resourcing = {
  utilization: number // % of capacity currently committed
  allocated: number // people committed to active missions
  capacity: number // total people
  openRoles: number
  allocation: { label: string; value: number }[] // how the team is split, sums ~100
}

export type PastProject = {
  name: string
  outcome: string
  period: string
}

export type TeamMember = {
  name: string
  title: string
  focus: string
  initials: string
  status: Status
}

export type Team = {
  id: string
  name: string
  lead: string
  status: Status
  icon: 'gear' | 'rocket' | 'chart'
  specialty: string
  disciplines: string[]
  summary: string
  insight: string
  headcount: number
  missions: number
  metrics: { label: string; value: string }[]
  resourcing: Resourcing
  pastProjects: PastProject[]
  members: TeamMember[]
}

export const teams: Team[] = [
  {
    id: 'engineering',
    name: 'Engineering',
    lead: 'Priya Desai',
    status: 'at-risk',
    icon: 'gear',
    specialty: 'Hardware & platform engineering — prototype development, systems integration and safety certification.',
    disciplines: ['Mechanical', 'Firmware', 'Systems integration', 'Test & validation', 'Data platform'],
    summary: 'Supplier delay could move prototype review by 4 days.',
    insight: 'Recovery plan is ready for your approval.',
    headcount: 42,
    missions: 4,
    metrics: [
      { label: 'Velocity', value: '92%' },
      { label: 'Open risks', value: '2' },
      { label: 'Prototype', value: 'Oct 10' },
    ],
    resourcing: {
      utilization: 94,
      allocated: 39,
      capacity: 42,
      openRoles: 3,
      allocation: [
        { label: 'Prototype v2', value: 45 },
        { label: 'Safety certification', value: 25 },
        { label: 'Data platform', value: 20 },
        { label: 'Bench / support', value: 10 },
      ],
    },
    pastProjects: [
      { name: 'Prototype v1 bring-up', outcome: 'Shipped 2 weeks early; passed first-pass EMC', period: 'Q1 2026' },
      { name: 'Firmware OTA pipeline', outcome: 'Cut release time from 3 days to 4 hours', period: 'Q4 2025' },
      { name: 'Thermal redesign', outcome: 'Reduced peak temps 18%, unblocked enclosure', period: 'Q3 2025' },
    ],
    members: [
      { name: 'Priya Desai', title: 'Team Lead', focus: 'Prototype v2 review and supplier recovery', initials: 'PD', status: 'on-track' },
      { name: 'Omar Haddad', title: 'Safety Certification Lead', focus: 'Cert test plan; alternate-lab evaluation', initials: 'OH', status: 'at-risk' },
      { name: 'Daniel Reyes', title: 'Staff Mechanical Engineer', focus: 'Prototype v2 enclosure and supplier recovery', initials: 'DR', status: 'at-risk' },
      { name: 'Mei Lin', title: 'Firmware Lead', focus: 'OTA pipeline and v2 bring-up firmware', initials: 'ML', status: 'on-track' },
      { name: 'Tomas Novak', title: 'Systems Integration Engineer', focus: 'v2 integration and bench bring-up', initials: 'TN', status: 'on-track' },
      { name: 'Sarah Whitfield', title: 'Test & Validation Engineer', focus: 'EMC and safety-cert test campaign', initials: 'SW', status: 'at-risk' },
      { name: 'Arjun Patel', title: 'Data Platform Engineer', focus: 'Data platform migration, phase 2', initials: 'AP', status: 'on-track' },
    ],
  },
  {
    id: 'operations',
    name: 'Operations',
    lead: 'Marcus Chen',
    status: 'on-track',
    icon: 'rocket',
    specialty: 'Manufacturing & supply chain — line qualification, supplier management and cost-down programs.',
    disciplines: ['Manufacturing', 'Supply chain', 'Quality', 'Logistics', 'Procurement'],
    summary: 'Manufacturing readiness on schedule for Q4.',
    insight: 'No action needed. Momentum is strong.',
    headcount: 28,
    missions: 3,
    metrics: [
      { label: 'Readiness', value: '96%' },
      { label: 'Open risks', value: '0' },
      { label: 'Q4 gate', value: 'On plan' },
    ],
    resourcing: {
      utilization: 82,
      allocated: 23,
      capacity: 28,
      openRoles: 2,
      allocation: [
        { label: 'Manufacturing readiness', value: 40 },
        { label: 'Supplier diversification', value: 25 },
        { label: 'Cost-down program', value: 20 },
        { label: 'Bench / support', value: 15 },
      ],
    },
    pastProjects: [
      { name: 'Second-source qualification', outcome: 'Removed single-supplier risk on 6 parts', period: 'Q1 2026' },
      { name: 'Line 2 stand-up', outcome: 'Doubled capacity; 99.2% first-pass yield', period: 'Q4 2025' },
      { name: 'Inbound logistics rework', outcome: 'Lead times down 22%, freight cost down 11%', period: 'Q2 2025' },
    ],
    members: [
      { name: 'Marcus Chen', title: 'Team Lead', focus: 'Q4 manufacturing readiness and hiring plan', initials: 'MC', status: 'on-track' },
      { name: 'Nadia Rahman', title: 'Manufacturing Lead', focus: 'Line qualification for the Q4 gate', initials: 'NR', status: 'on-track' },
      { name: 'Kwame Osei', title: 'Supply Chain Manager', focus: 'Supplier diversification, second-source qual', initials: 'KO', status: 'on-track' },
      { name: 'Lena Fischer', title: 'Quality Engineer', focus: 'First-pass yield and incoming inspection', initials: 'LF', status: 'on-track' },
      { name: 'Diego Morales', title: 'Logistics Lead', focus: 'Inbound logistics and freight cost-down', initials: 'DM', status: 'on-track' },
      { name: 'Priyanka Shah', title: 'Procurement Specialist', focus: 'Cost-down program sourcing', initials: 'PS', status: 'on-track' },
      { name: 'Hannah Berg', title: 'Manufacturing Engineer', focus: 'Line 2 tooling and ramp', initials: 'HB', status: 'on-track' },
    ],
  },
  {
    id: 'commercial',
    name: 'Commercial',
    lead: 'Elena Park',
    status: 'on-track',
    icon: 'chart',
    specialty: 'Go-to-market & partnerships — partner demos, pipeline growth and customer success.',
    disciplines: ['Partnerships', 'Sales', 'Marketing', 'Customer success', 'Brand'],
    summary: 'Partner demo on schedule for October 6.',
    insight: 'Consider aligning resources with engineering (shared team).',
    headcount: 19,
    missions: 3,
    metrics: [
      { label: 'Pipeline', value: '$4.2M' },
      { label: 'Open risks', value: '0' },
      { label: 'Partner demo', value: 'Oct 6' },
    ],
    resourcing: {
      utilization: 76,
      allocated: 14,
      capacity: 19,
      openRoles: 1,
      allocation: [
        { label: 'Partner demo', value: 35 },
        { label: 'Brand refresh', value: 25 },
        { label: 'Support scale-up', value: 25 },
        { label: 'Bench / support', value: 15 },
      ],
    },
    pastProjects: [
      { name: 'Lighthouse partner launch', outcome: 'Closed 3 design wins; $1.8M new pipeline', period: 'Q1 2026' },
      { name: 'Support tooling rollout', outcome: 'Response times down 30%, CSAT up to 94%', period: 'Q4 2025' },
      { name: 'Category rebrand', outcome: 'Doubled inbound demo requests quarter-on-quarter', period: 'Q3 2025' },
    ],
    members: [
      { name: 'Elena Park', title: 'Team Lead', focus: 'Partner demo and Q4 pipeline', initials: 'EP', status: 'on-track' },
      { name: 'James Okafor', title: 'Partnerships Lead', focus: 'Partner demo runbook and design wins', initials: 'JO', status: 'on-track' },
      { name: 'Sofia Ricci', title: 'Account Executive', focus: 'Q4 pipeline and demo follow-through', initials: 'SR', status: 'on-track' },
      { name: 'Aiden Clarke', title: 'Product Marketing Manager', focus: 'Launch brand refresh and messaging', initials: 'AC', status: 'on-track' },
      { name: 'Yuki Tanaka', title: 'Customer Success Lead', focus: 'Support scale-up and CSAT', initials: 'YT', status: 'on-track' },
      { name: 'Nora Adebayo', title: 'Brand Designer', focus: 'Launch brand refresh creative', initials: 'NA', status: 'on-track' },
    ],
  },
]

export const crossTeamDependency = {
  title: 'AI detected a cross-team dependency',
  detail: 'Prototype testing and the partner demo need the same engineering team.',
}

// The 6 base projects — the spine of the company. The first three are shipped
// PRODUCTS; the other three are EXPLORATIONS in different testing stages, run
// to determine the products to build around them. Missions roll up to these.
export type ProjectKind = 'product' | 'exploration'

export type Project = {
  id: string
  code: string
  name: string
  kind: ProjectKind
  stage: string
  status: Status
  team: string
  lead: string
  progress: number
  gate: string
  gateMonth: number
  gateDay: number
  summary: string
  insight: string
  metrics: { label: string; value: string }[]
  missionIds: string[]
}

export const projects: Project[] = [
  // ── Products (fielded device platforms) ────────────────────────────────
  {
    id: 'p-sensor',
    code: 'QSA',
    name: 'Quantum Sensor Array',
    kind: 'product',
    stage: 'Fielded',
    status: 'on-track',
    team: 'Engineering',
    lead: 'Priya Desai',
    progress: 84,
    gate: 'v2 field trial · Nov',
    gateMonth: 11,
    gateDay: 20,
    summary: 'Precision quantum-sensing array deployed for magnetometry and non-destructive materials inspection.',
    insight: 'Field data is strong — line up the v2 trial while the team has slack.',
    metrics: [
      { label: 'Sensitivity', value: 'sub-pT' },
      { label: 'Deployments', value: '18' },
      { label: 'Uptime', value: '99.8%' },
    ],
    missionIds: ['m-data'],
  },
  {
    id: 'p-photon',
    code: 'SPX',
    name: 'Single-Photon Source',
    kind: 'product',
    stage: 'Scaling',
    status: 'on-track',
    team: 'Operations',
    lead: 'Marcus Chen',
    progress: 72,
    gate: 'Q4 capacity · Nov 30',
    gateMonth: 11,
    gateDay: 30,
    summary: 'Photonic single-photon source scaling production to meet quantum-computing demand.',
    insight: 'Manufacturing readiness is nominal; the second-source qualification de-risks Q4.',
    metrics: [
      { label: 'Purity', value: '99.3%' },
      { label: 'Yield', value: '96%' },
      { label: 'Backlog', value: '11 units' },
    ],
    missionIds: ['m-mfg', 'm-supply', 'm-cost'],
  },
  {
    id: 'p-cryo',
    code: 'CRX',
    name: 'Cryogenic Control System',
    kind: 'product',
    stage: 'Fielded',
    status: 'on-track',
    team: 'Commercial',
    lead: 'Elena Park',
    progress: 77,
    gate: 'Partner demo · Oct 6',
    gateMonth: 10,
    gateDay: 6,
    summary: 'Cryogenic control platform for quantum devices, anchoring the partner motion.',
    insight: 'The partner demo is the near-term growth lever — keep the support window locked.',
    metrics: [
      { label: 'Installs', value: '23' },
      { label: 'Stability', value: '±2 mK' },
      { label: 'Pipeline', value: '$4.2M' },
    ],
    missionIds: ['m-demo', 'm-brand', 'm-support', 'm-hire'],
  },
  // ── Explorations (in testing, to determine products) ───────────────────
  {
    id: 'p-neutron',
    code: 'CNS',
    name: 'Compact Neutron Source',
    kind: 'exploration',
    stage: 'Prototype · ALLS',
    status: 'on-track',
    team: 'Engineering',
    lead: 'Sylvain Fourmaux',
    progress: 58,
    gate: 'Scale-up review · Q1',
    gateMonth: 12,
    gateDay: 22,
    summary:
      'Laser-driven compact neutron source with INRS on the ALLS facility — the highest neutron flux ever generated with a laser (~100× prior methods). Toward compact, affordable neutron sources for imaging and non-destructive testing.',
    insight: 'World-record result published in Nature Communications — define the productization path before the scale-up review.',
    metrics: [
      { label: 'Neutron flux', value: 'Record' },
      { label: 'vs. prior', value: '100×' },
      { label: 'Readiness', value: 'TRL 4' },
    ],
    missionIds: [],
  },
  {
    id: 'p-proto',
    code: 'PV2',
    name: 'Prototype v2',
    kind: 'exploration',
    stage: 'Design validation',
    status: 'at-risk',
    team: 'Engineering',
    lead: 'Priya Desai',
    progress: 62,
    gate: 'Review · Oct 10',
    gateMonth: 10,
    gateDay: 10,
    summary: 'Next-gen device prototype in design validation. A supplier delay is threatening the Oct 10 review.',
    insight: 'The only NO-GO on the board. Approve the alternate supplier to protect the review date.',
    metrics: [
      { label: 'Stage', value: 'DVT' },
      { label: 'Open risks', value: '2' },
      { label: 'Review', value: 'Oct 10' },
    ],
    missionIds: ['m-proto', 'm-cert'],
  },
  {
    id: 'p-materials',
    code: 'QMP',
    name: 'Quantum Materials Platform',
    kind: 'exploration',
    stage: 'Technical validation',
    status: 'on-track',
    team: 'Engineering',
    lead: 'Mei Lin',
    progress: 34,
    gate: 'Go/No-go · Dec',
    gateMonth: 12,
    gateDay: 10,
    summary: 'Quantum-materials characterization platform in technical validation to determine whether to build a product around it.',
    insight: 'Validation is on plan; a go/no-go call is due in December.',
    metrics: [
      { label: 'Stage', value: 'Validation' },
      { label: 'Benchmarks', value: '3/5' },
      { label: 'Decision', value: 'Dec' },
    ],
    missionIds: [],
  },
]

export const productProjects = projects.filter((p) => p.kind === 'product')
export const explorationProjects = projects.filter((p) => p.kind === 'exploration')

export function projectFor(missionId: string): Project | undefined {
  return projects.find((p) => p.missionIds.includes(missionId))
}
export function missionsForProject(p: Project): Mission[] {
  return p.missionIds
    .map((id) => missions.find((m) => m.id === id))
    .filter((m): m is Mission => Boolean(m))
}
export function projectsForTeam(teamName: string): Project[] {
  return projects.filter((p) => p.team === teamName)
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
  nextSteps?: string[]
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
    nextSteps: [
      'Approve the alternate supplier to hold the Oct 10 date.',
      'Lock the review agenda and circulate to reviewers.',
      'Confirm the test rig is booked for the week of Oct 6.',
    ],
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
    nextSteps: [
      'Approve the partner briefing so it can go out today.',
      'Run the final rehearsal with the demo team midweek.',
      'Lock the engineering support window before the allocation call.',
    ],
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
    nextSteps: [
      'Approve the alternate lab to remove the schedule dependency.',
      'Finalize the test plan and pre-submit documentation.',
      'Add a $120K contingency from the travel underspend.',
    ],
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

// AI Copilot — the proactive "here's what I'd do next" queue for the flight
// director. Each item is an action Steve can accept / act on / dismiss.
export type Recommendation = {
  id: string
  title: string
  rationale: string
  impact: 'high' | 'medium' | 'low'
  category: string
  icon: 'branch' | 'calendar' | 'users' | 'file' | 'alert' | 'link'
  actionLabel: string
  to?: string
}

export const recommendations: Recommendation[] = [
  {
    id: 'r-supplier',
    title: 'Approve the alternate supplier',
    rationale: 'Holds the Oct 10 prototype review at ~3% higher unit cost. The only NO-GO on the board clears with your go.',
    impact: 'high',
    category: 'Schedule',
    icon: 'branch',
    actionLabel: 'Approve',
    to: '/decisions',
  },
  {
    id: 'r-allocation',
    title: 'Sequence prototype testing ahead of the partner demo',
    rationale: 'Resolves the October engineering conflict and protects the certification path. Demo gets 3 engineers from Oct 7.',
    impact: 'high',
    category: 'Resourcing',
    icon: 'users',
    actionLabel: 'Apply',
    to: '/decisions',
  },
  {
    id: 'r-briefing',
    title: 'Send the partner briefing for review',
    rationale: 'The one-page briefing for the Oct 6 demo is drafted and ready. Sending now keeps Commercial on schedule.',
    impact: 'medium',
    category: 'Comms',
    icon: 'file',
    actionLabel: 'Send',
    to: '/knowledge',
  },
  {
    id: 'r-cert',
    title: 'Open the alternate cert-lab slot',
    rationale: 'Removes the third-party lab dependency on safety certification and de-risks the Dec 15 gate.',
    impact: 'medium',
    category: 'Risk',
    icon: 'alert',
    actionLabel: 'Open',
    to: '/missions/m-cert',
  },
  {
    id: 'r-sync',
    title: 'Sync with Elena on shared engineering',
    rationale: 'Commercial and Engineering share a team in October. A 15-minute sync now avoids a scheduling clash later.',
    impact: 'low',
    category: 'Comms',
    icon: 'users',
    actionLabel: 'Schedule',
  },
]
