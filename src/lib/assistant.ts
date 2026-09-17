// Local, canned "assistant" for the demo — no API.
// Keyword-matched answers shared by the Ask bar and the chat interface.

export function answerFor(q: string): string {
  const t = q.toLowerCase()
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
  return 'Here is the board from your company signals: 8 of 10 missions on track, 3 decisions on your console this week, and 2 open anomalies (down from 4). One station is off-nominal — Engineering, on the supplier delay. Ask me about a specific team, mission, risk or decision and I’ll go deeper.'
}

export const todayIntro =
  'Good morning, Steve. All stations are polled and reporting. Two priorities need your call today: approve the supplier recovery plan and resolve the October engineering allocation. Ask me anything about today — risks, decisions, teams or a specific mission.'
