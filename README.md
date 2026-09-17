# Mission Control

An AI **company-intelligence dashboard** — a clickable, front-end-only demo.
Everything runs in the browser with local demo data; there is **no backend or API**.

![Overview](docs/overview.png)

## What's inside

A director's-eye view that rolls team signals up into one command surface:

- **Overview** — an AI morning brief, today's focus, headline stats (missions on
  track, decisions needed, risks, hours saved), a company overview with per-team
  cards + AI insights, the decisions that need you, and an "Ask Mission Control"
  bar.
- **Missions** — every mission with status, owner, due date and progress;
  filter by _All / On track / At risk_. Each card opens a **mission detail**
  page (`/missions/:id`) with milestones, an at-risk callout, the owning team
  and key facts.
- **Teams** — Engineering, Operations and Commercial, each with specialty and
  disciplines, **resourcing** (utilization + allocation breakdown + open
  roles), **past projects** with outcomes, metrics and an AI insight. Overview
  team cards deep-link here.
- **Decisions** — interactive decision cards: pick an option (the AI-recommended
  one is pre-selected) and confirm.
- **AI Activity** — a timeline of what the assistant did on your behalf.
- **Knowledge** — a searchable library of company docs.

### Interactive, no API

- The **search** box (top bar) filters across missions, teams, decisions and docs.
- **Ask about today** opens a demo chat interface; **Ask Mission Control** answers
  from canned, keyword-matched responses.
- The **focus priorities** in the hero are clickable and route to the relevant page.
- **Mission cards** open a full mission detail view; **decisions** are selectable
  and confirmable; actions surface toast feedback.
- All the demo content lives in [`src/data.ts`](src/data.ts) — edit it there.

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
  App.tsx             # routes
  components/         # Layout, Sidebar, TopBar, AskBar, Toast, icons, ui
  pages/             # Overview, Missions, Teams, Decisions, AIActivity, Knowledge
```
