# Mission Control

An AI **company-intelligence dashboard** — a clickable, front-end-only demo.
Everything runs in the browser with local demo data; there is **no backend or API**.

![Overview](docs/overview.png)

## What's inside

The company runs on **six base projects** — three shipped **products** (Aperture
Sensor Array, Relay Ground Station, Nova Flight Software) and three **explorations
in testing** (Prototype v2, Autonomy Stack, Edge Data Platform). These are the
spine: the Overview surfaces the portfolio, a **Projects** view groups them, and
every mission, team and decision ties back to a project (missions roll up to their
project; teams show the projects they own; a project's page lists its missions).

A flight-director's-eye view that rolls team signals up into one command surface.
The demo is framed as a mission control for Steve MacLean, Director at Infinite
Potential Labs, running the company from the director's console — so it uses authentic
mission-control language (T‑minus gates, Go / No‑Go readiness, nominal /
off‑nominal) throughout.

- **Control Room** — the mission-control "big board": an **orbit view** with the
  six base projects as the reference point — each block sits on an orbit ring
  around a live T‑minus hub for the next gate, with portfolio stats (on track,
  stations go, next gate, anomalies, utilisation) on leader lines outside the
  ring — then a **portfolio timeline** (each project's gates and mission
  milestones on a Now → year-end axis), the Go/No-Go **stations** board, a
  **"Needs your call"** panel (open decisions + anomalies) and an **event log**.
- **Overview** — a **T‑minus mission clock** to the next gate, an AI morning
  brief, today's focus, clickable headline stats (missions, decisions, risks,
  hours saved), a **Flight Readiness (Go / No‑Go) board**, a company overview
  with per-team cards + AI insights, the decisions that need you, and an
  "Ask Mission Control" bar.
- **Missions** — every mission with status, owner, due date and progress;
  filter by _All / On track / At risk_. Each card opens a **mission detail**
  page (`/missions/:id`) with milestones, an at-risk callout, the owning team
  and key facts.
- **Teams** — Engineering, Operations and Commercial, each with specialty and
  disciplines, **resourcing** (utilization + allocation breakdown + open
  roles), **past projects** with outcomes, a full **crew roster** (every person
  with role, current focus and status), metrics and an AI insight. Overview
  team cards deep-link here.
- **Decisions** — interactive decision cards: pick an option (the AI-recommended
  one is pre-selected) and confirm.
- **AI Analysis** — the analyst's desk, computed live from the board: a
  **schedule forecast** per project (progress vs plan line, SPI, predicted gate
  and slip, confidence, risk score with drivers), a **risk heatmap** (projects ×
  schedule / resourcing / technical / supply / commercial), **anomaly detection**
  (missions behind plan, over-committed teams, gate collisions, NO-GO stations,
  pending decisions), a **what-if simulator** (move engineers between projects
  and see both gates move), an 8-week **resource forecast** per team, a
  **briefing generator** (board / team leads / for me — copy or send) and the
  **questions worth asking**, each answerable in chat.
- **AI Activity** — a timeline of what the assistant did on your behalf.
- **Knowledge** — a searchable library of company docs.

### Interactive, no API

- **⌘K command palette** — press ⌘K / Ctrl+K to search and jump to any mission,
  team, decision or doc, or run quick actions, from anywhere. (This is where
  global search lives.)
- **AI Copilot** (Overview) — a ranked queue of recommended actions Steve can
  Accept / View / Dismiss, plus checkable **AI next steps** on each mission.
- **Ask about today** opens a demo chat interface; **Ask Mission Control** answers
  are **computed from the data** — name any project, mission or team, or ask for
  a forecast, what is due this week, team capacity, the biggest risk, next gates
  or anomalies — with canned narrative answers as the fallback. Every project
  page has an **AI analysis** card (forecast, plan line, SPI, risk score, drivers,
  risk profile) with one-click questions that open the chat pre-asked.
- The **focus priorities** in the hero are clickable and route to the relevant page.
- **Mission cards** open a full mission detail view; **decisions** are selectable
  and confirmable; actions surface toast feedback.
- All the demo content lives in [`src/data.ts`](src/data.ts) — edit it there.

## Design

A deep-space, typography-led system in the SpaceX / Tesla idiom: a live WebGL
planet fills the entire top of the Overview under a wide, tracked uppercase tab
bar (brand left, tabs on a hairline, status and profile right — no sidebar).
Glass panels, hairlines instead of boxes, amber numerals with sky-blue labels
for readouts. Montserrat for display and tabs, Inter for UI, JetBrains Mono for
every readout.

## Tech

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Project structure

```
src/
  data.ts             # single source of demo data
  lib/intel.ts        # forecasts, risk, anomalies, simulator, briefings (computed)
  lib/assistant.ts    # data-aware answer engine for the chat / ask bar
  App.tsx             # routes
  components/         # Layout, TopNav, Planet (WebGL), AskBar, ChatModal, Toast, icons, ui
  pages/             # Overview, Missions, Teams, Decisions, AIActivity, Knowledge
```
