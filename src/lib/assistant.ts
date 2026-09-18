// Local "assistant" for the demo — no API.
// Answers are computed from the dataset first (projects, missions, teams,
// forecasts), then fall back to canned narrative answers for open questions.

import { projects, missions, teams, decisions, flightReadiness, missionsForProject, projectsForTeam } from '../data'
import { forecastProject, forecasts, findProject, findMission, findTeam, dueWithin, fmt, detectAnomalies, riskMatrix } from './intel'

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w))

function projectAnswer(t: string): string | null {
  const p = findProject(t)
  if (!p) return null
  const f = forecastProject(p)
  const ms = missionsForProject(p)
  if (has(t, 'forecast', 'slip', 'predict', 'land', 'hold', 'make it', 'on time', 'when'))
    return f.slipDays > 0
      ? `${p.name} (${p.code}) is forecast to slip ${f.slipDays} days if nothing changes — ${p.gate} would land ${fmt(f.predictedGate)}. It is ${p.progress}% complete against ${f.expected}% expected (SPI ${f.spi.toFixed(2)}). Drivers: ${f.drivers.join('; ')}. Confidence ${f.confidence}.`
      : `${p.name} (${p.code}) is forecast to hold its gate (${p.gate}), T-${f.daysToGate}. Progress ${p.progress}% vs ${f.expected}% expected — ${f.trend}. Risk score ${f.riskScore}/100, confidence ${f.confidence}.`
  if (has(t, 'risk', 'worr', 'driver', 'why'))
    return `${p.code} risk score is ${f.riskScore}/100 (${f.confidence} confidence). ${f.drivers.join('. ')}. ${p.insight}`
  if (has(t, 'who', 'lead', 'owner', 'team'))
    return `${p.name} is led by ${p.lead} on the ${p.team} team. ${ms.length ? `Mission owners: ${[...new Set(ms.map((m) => m.owner))].join(', ')}.` : 'No missions are attached yet.'}`
  if (has(t, 'mission', 'what is happening', "what's happening", 'going on'))
    return ms.length
      ? `${p.code} has ${ms.length} missions: ${ms.map((m) => `${m.name} (${m.progress}%, ${m.status.replace('-', ' ')}, due ${m.due})`).join('; ')}.`
      : `${p.code} is pre-mission — an exploration at ${p.stage}. Next gate ${p.gate}.`
  return `${p.name} (${p.code}) — ${p.kind === 'product' ? 'product' : 'exploration'} at ${p.stage}, ${p.status.replace('-', ' ')}, ${p.progress}% complete, gate ${p.gate} (T-${f.daysToGate}). ${p.summary} Forecast: ${f.slipDays > 0 ? `+${f.slipDays} days unmitigated` : 'holds the gate'}; risk ${f.riskScore}/100. ${p.insight}`
}

function missionAnswer(t: string): string | null {
  const m = findMission(t)
  if (!m) return null
  const p = projects.find((q) => q.missionIds.includes(m.id))
  return `${m.name} — ${m.status.replace('-', ' ')}, ${m.progress}% complete, due ${m.due}, owned by ${m.owner} (${m.team}${p ? `, rolls up to ${p.code}` : ''}). ${m.summary}${m.nextSteps ? ` Next steps: ${m.nextSteps.join(' ')}` : ''}`
}

function teamAnswer(t: string): string | null {
  const tm = findTeam(t)
  if (!tm) return null
  const r = tm.resourcing
  const owned = projectsForTeam(tm.name)
  if (has(t, 'util', 'capacity', 'load', 'busy', 'bandwidth', 'resourc', 'overload'))
    return `${tm.name} is at ${r.utilization}% utilisation — ${r.allocated} of ${r.capacity} committed, ${r.openRoles} open roles. Allocation: ${r.allocation.map((a) => `${a.label} ${a.value}%`).join(', ')}. ${r.utilization >= 90 ? 'That is above the 90% line: a slip anywhere has nowhere to go.' : 'There is slack to absorb a surprise.'}`
  if (has(t, 'who', 'member', 'people', 'roster'))
    return `${tm.name} (${tm.headcount} people, lead ${tm.lead}): ${tm.members.map((m) => `${m.name} — ${m.title}`).join('; ')}.`
  return `${tm.name} — ${tm.status.replace('-', ' ')}, led by ${tm.lead}, ${tm.headcount} people at ${r.utilization}% utilisation. Owns ${owned.map((p) => p.code).join(', ')}. ${tm.summary} ${tm.insight}`
}

function portfolioAnswer(t: string): string | null {
  if (has(t, 'due', 'this week', 'next week', 'coming up', 'deadline')) {
    const days = has(t, 'month', '30') ? 30 : has(t, 'two week', '2 week', 'fortnight', 'next week') ? 14 : 7
    const items = dueWithin(days)
    return items.length
      ? `Due in the next ${days} days: ${items.map((x) => `${x.m.name} (${x.m.due}, ${x.m.progress}%, ${x.m.status.replace('-', ' ')})`).join('; ')}.`
      : `Nothing is due in the next ${days} days. The nearest item is ${dueWithin(90)[0]?.m.name ?? '—'}.`
  }
  if (has(t, 'forecast', 'slip', 'predict', 'schedule')) {
    const fs = forecasts()
    const slipping = fs.filter((f) => f.slipDays > 0)
    return `Schedule forecast across the six projects: ${slipping.length ? slipping.map((f) => `${f.project.code} +${f.slipDays}d (lands ${fmt(f.predictedGate)})`).join(', ') : 'no gate is forecast to slip'}. Ahead of plan: ${fs.filter((f) => f.trend === 'ahead').map((f) => f.project.code).join(', ') || 'none'}. Highest risk score: ${[...fs].sort((a, b) => b.riskScore - a.riskScore)[0].project.code}.`
  }
  if (has(t, 'anomal', 'detect', 'wrong', 'off-nominal', 'off nominal')) {
    const an = detectAnomalies().slice(0, 5)
    return `I'm tracking ${detectAnomalies().length} anomalies. Top: ${an.map((a) => `${a.title} (${a.severity})`).join('; ')}.`
  }
  if (has(t, 'at risk', 'behind', 'trouble', 'red')) {
    const ps = projects.filter((p) => p.status !== 'on-track')
    const ms = missions.filter((m) => m.status !== 'on-track')
    return `At risk: ${ps.map((p) => `${p.name} (${p.code})`).join(', ') || 'no projects'}; missions ${ms.map((m) => `${m.name} (due ${m.due})`).join(', ')}. Everything else is on track.`
  }
  if (has(t, 'util', 'capacity', 'overload', 'bandwidth', 'who is busy'))
    return `Utilisation: ${teams.map((tm) => `${tm.name} ${tm.resourcing.utilization}% (${tm.resourcing.allocated}/${tm.resourcing.capacity})`).join(', ')}. Engineering is the constraint — it owns four of six projects and sits above 90%.`
  if (has(t, 'gate', 'milestone', 'next up')) {
    const fs = forecasts().filter((f) => f.daysToGate >= 0).sort((a, b) => a.daysToGate - b.daysToGate)
    return `Next gates: ${fs.map((f) => `${f.project.code} ${f.project.gate} (T-${f.daysToGate}${f.slipDays ? `, +${f.slipDays}d forecast` : ''})`).join('; ')}.`
  }
  if (has(t, 'heatmap', 'matrix', 'biggest risk', 'riskiest', 'most risk')) {
    const top = [...riskMatrix()].sort((a, b) => b.total - a.total)[0]
    const hot = Object.entries(top.cells).filter(([, v]) => v >= 2).map(([k]) => k)
    return `${top.project.name} carries the most risk (${top.total}/15 on the heatmap) — hot cells: ${hot.join(', ')}. ${top.project.insight}`
  }
  if (has(t, 'decision', 'call', 'approve'))
    return `${decisions.length} decisions are on your console: ${decisions.map((d) => `${d.title} — recommendation: ${d.recommendation}`).join('; ')}.`
  if (has(t, 'product', 'explor', 'testing'))
    return `Three products: ${projects.filter((p) => p.kind === 'product').map((p) => `${p.name} (${p.stage})`).join(', ')}. Three explorations in testing: ${projects.filter((p) => p.kind === 'exploration').map((p) => `${p.name} (${p.stage})`).join(', ')}.`
  if (has(t, 'summar', 'status', 'board', 'overall', 'everything'))
    return `Portfolio: ${projects.filter((p) => p.status === 'on-track').length}/${projects.length} projects on track, ${missions.filter((m) => m.status === 'on-track').length}/${missions.length} missions on track, ${flightReadiness.filter((r) => r.status === 'go').length}/${flightReadiness.length} stations GO, ${decisions.length} decisions open. ${forecasts().filter((f) => f.slipDays > 0).length} project forecast to slip without action.`
  return null
}

export function answerFor(q: string): string {
  const t = q.toLowerCase()

  const computed = projectAnswer(t) ?? missionAnswer(t) ?? teamAnswer(t) ?? portfolioAnswer(t)
  if (computed) return computed

  if (t.includes('overnight') || t.includes('change'))
    return 'Since yesterday: the prototype review went off-nominal on a supplier delay — a 4-day slip risk, with a recovery plan Engineering has drafted. Operations closed its last open risk, and three team updates landed for your review. Every other station is nominal.'
  if (t.includes('step in') || t.includes('where'))
    return 'Two places. First, approve the alternate-supplier recovery plan — it protects the Oct 10 prototype review. Second, resolve the engineering allocation conflict in October between prototype testing and the partner demo. The other 8 missions need nothing from you today.'
  if (t.includes('risk'))
    return 'Two risks are open. The supplier delay (high) threatens the prototype review date — mitigation is the alternate supplier awaiting your approval. The safety-certification lab slot (medium) is being covered by evaluating an alternate lab. Risks are down from 4 last week.'
  if (t.includes('supplier'))
    return 'The primary supplier signalled a delay that would push the prototype review ~4 days to Oct 14. Switching to the qualified alternate supplier holds the Oct 10 date at ~3% higher unit cost for this batch. Engineering recommends the switch.'
  if (t.includes('hiring') || t.includes('hire'))
    return 'Q4 hiring is on plan: 6 of 10 roles filled, pipeline healthy for the rest, targeted to close by Oct 31. No action needed from you.'
  if (t.includes('demo') || t.includes('partner'))
    return 'The partner demo is on track for Oct 6 — environment ready, final rehearsal next week. The one watch-item is that it shares the engineering team with prototype testing; resolving the October allocation removes that dependency.'
  if (t.includes('finance') || t.includes('budget'))
    return 'Finance is on plan. One open item: certification costs came in ~$120K above plan. The recommended source is the travel budget, which is 40% underspent, with no impact to active missions.'
  if (t.includes('priorit') || t.includes('today') || t.includes('focus'))
    return 'Today comes down to two Go / No-Go calls. 1) Approve the recovery plan for the supplier delay to hold the Oct 10 prototype review. 2) Resolve the October engineering allocation between prototype testing and the partner demo. After that, three team updates are waiting for a quick review.'
  if (t.includes('readiness') || t.includes('go') || t.includes('nominal'))
    return 'Readiness poll: Operations, Commercial, Finance and Hiring are all GO. Engineering is the one NO-GO — the supplier delay holds the prototype review until you approve the recovery plan. Clear that call and the board goes all-GO.'
  return 'Here is the board from your company signals: 8 of 10 missions on track, 3 decisions on your console this week, and 2 open anomalies (down from 4). One station is off-nominal — Engineering, on the supplier delay. Try: "forecast for PV2", "what is due this week", "engineering utilisation", "biggest risk", or name any project, mission or team.'
}

export const todayIntro =
  'Good morning, Steve. All stations are polled and reporting. Two priorities need your call today: approve the supplier recovery plan and resolve the October engineering allocation. Ask me anything — a project forecast, what is due this week, team capacity, the biggest risk, or any mission by name.'
