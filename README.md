# Intelligent Inventory Dashboard

## Overview

A dashboard for car dealership managers to see which vehicles have been sitting in inventory too long, and to log what they're doing about it — instead of relying on memory or a spreadsheet.

This project fully builds the **frontend**, with a simplified but fully working backend (data really saves to a file; a logged action survives a page reload).

Architecture, technology choices, and observability strategy are covered separately in `SYSTEM_DESIGN.md`. This README focuses on running, testing, and the AI collaboration process.

## Features

- **Browse & filter inventory** — searchable, paginated vehicle table with expandable detail rows (VIN, color, mileage, intake date).
- **Aging-stock detection** — vehicles auto-flagged as **aging** (90+ days) or **critical** (150+ days), with a summary banner and charts.
- **Action logging** — log a status + optional note against any aging/critical vehicle, saved persistently. A rule-based suggested action is shown for vehicles never reviewed.
- **Add/remove vehicles** — so the dashboard can actually be used day-to-day, not just viewed.

## Getting Started

**Requirements:** Node.js 20 (see `.nvmrc`)

```bash
npm install
```

**Run everything** (frontend + mock data API):

```bash
npm run dev:all
```

- Dashboard: http://localhost:5173
- Mock API: http://localhost:3001

Run separately if needed: `npm run dev` (frontend only) or `npm run mock-api` (API only).

No setup is required to run this out of the box — the app defaults to the correct API address automatically. Only edit `.env` (see `.env.example`) if pointing at a different backend URL.

## Testing

The business logic (aging/severity rules, filtering, pagination, validation) is written as plain, framework-independent functions with no UI or network dependencies. That separation is what makes it possible to test the logic directly and precisely, without going through the app itself.

### Testing approach

- **Boundary-value testing at the exact thresholds the logic depends on** — 90 vs. 91 days (aging) and 150 vs. 151 days (critical). Testing directly at a boundary is what actually exercises a `>` vs. `>=` decision; a test comfortably on either side would still pass even if that comparison were wrong.
- **Deterministic dates via an injectable `asOfDate`** — every date-dependent function takes an optional reference date (defaulting to `new Date()` in production, but always fixed in tests), so results don't depend on what day the tests happen to run.
- **Defensive/edge-case coverage** — empty arrays, zero and negative values, future dates, and malformed input are tested deliberately, since these are exactly the inputs a real browser can produce (an empty inventory, a future intake date, a mistyped VIN).
- **Non-mutation checks** — functions that operate on the vehicle array (`filterVehicles`, `getAgingVehicles`, `paginateVehicles`, `getSeverityBreakdownByMake`) each have a dedicated test confirming the input is left untouched.

### Coverage

- Days-in-inventory and severity threshold logic (`getDaysInInventory`, `isAgingStock`, `getAgingSeverity`).
- Make/model/year/VIN/day-range filtering (`filterVehicles`), including the convention that an empty or `undefined` filter value means "no active filter," not "match nothing."
- Pagination bounds and clamping (`paginateVehicles`): exact-multiple and remainder page splits, and clamping an out-of-range page number back into range.
- Aggregate stats and chart-supporting aggregations (`getAverageDaysInInventory`, `getTotalInventoryValue`, `getAgingVehicles`, `getSeverityBreakdownByMake`, `getDaysInInventoryDistribution`), including sort order and that a make with zero aging/critical vehicles still appears rather than being silently dropped.
- The recommended-action heuristic (`getRecommendedAction`).
- New-vehicle validation (`validateNewVehicle`): required fields, numeric/date bounds, VIN format (length, character set, I/O/Q exclusion) and case-insensitive uniqueness, with every applicable error reported at once rather than stopping at the first one found.

```bash
npm run test
```

Runs 85 tests across 2 files: 84 in `src/lib/inventoryLogic.test.ts` covering the business logic above, plus 1 smoke test in `src/App.test.tsx` left over from the initial scaffold.

```bash
npm run lint
```

### What this suite does not cover

Component rendering and end-to-end UI flows aren't covered by automated tests, beyond the one scaffold-era smoke test. This was a deliberate scope decision: UI behavior was verified manually at each build stage against an explicit checklist, rather than adding browser-automation tooling that would have been disproportionate to a project of this size.

## Project Structure

- `src/lib` — framework-independent business logic, fully unit-tested.
- `src/components` — the React UI, one component per dashboard section.
- `src/api` — fetch wrappers around the mock API.
- `src/hooks` — TanStack Query hooks built on the API layer.
- `mock-server/` — the json-server mock backend and its seed data.

## AI Collaboration Narrative

### High-level strategy

Two AI assistants, two separate jobs: Claude (chat) as a **planning partner** to think through trade-offs and lock in decisions before any code was written, and Claude Code as the **builder**, which only implemented decisions already made — it never made an architectural call on its own.

For me, the first setup prompt is where I lay out all the boundaries and rules: what to prioritize, what's actually in scope, and what isn't. For this project I kept four separate chats open — one for brainstorming, one for generating prompts, one for fixing errors and bugs, and one (Claude Code) as the builder actually writing and implementing code.

Here's the setup prompt I used to open the prompt-drafting chat, which stayed in charge of turning decisions into scoped prompts for the rest of the build:

```
You are my prompt-drafting and spec partner for a technical assessment I'm building. You are NOT going to write code — your job is to help me think clearly and turn decisions into precise, well-scoped prompts that I will paste into Claude Code (running in VS Code) to actually implement.

CONTEXT
This is Keyloop's technical assessment. I've chosen:
- Scenario B: Intelligent Inventory Dashboard (domain: Supply)
- Layer to implement fully: Frontend (web app), with the backend mocked (static data / local JSON server, e.g. json-server)
- Core requirements:
  1. Inventory Visualization: filterable list of all vehicles in a dealership's inventory (filter by make, model, age)
  2. Aging Stock Identification: automatically identify and prominently display "aging stock" (vehicles in inventory >90 days)
  3. Actionable Insights: let a manager log and persist a status/proposed action per aging vehicle (e.g. "Price Reduction Planned")

Required deliverables:
1. A System Design Document (architecture diagram, component roles, data flow, tech stack + justification, observability strategy, and a section on how GenAI helped in the design phase)
2. A Git repo with the working frontend app: README.md with build/run/test instructions, a dedicated "AI Collaboration Narrative" section, and a test suite covering the core business logic
3. A 5-10 min video: intro + scenario, design/implementation walkthrough, AI collaboration story (1-2 min), live demo, lessons learned/challenges

Evaluation criteria I'm being scored on: system design clarity, technical execution/testing quality, my process for directing + verifying AI output (not just the end result), and communication/presentation quality.

My background (for justifying tech choices and framing the AI narrative): I'm a cloud data engineer / AWS Solutions Architect with hands-on experience in dashboards (Power BI, Tableau), React Native app development, and I currently manage real inventory operations (stock intake, rotation, logistics) at a supermarket — this scenario maps directly onto that experience.

YOUR JOB IN THIS CHAT
- Help me nail down decisions before I hand anything to Claude Code: data model, exact acceptance criteria per requirement, tech stack, and any assumptions I need to make for ambiguous parts of the brief (document these, don't silently guess).
- When I describe what I want built next, turn it into a single, scoped, unambiguous prompt I can paste directly into Claude Code — small enough that I can verify the output before moving to the next step (e.g. scaffold → mock data/API → business logic + tests → UI → polish, one prompt per stage, not one giant prompt).
- Push back if I'm about to hand Claude Code something too broad or underspecified.
- Keep a running list of the assumptions and decisions we lock in during this chat — I'll use this to write the System Design Document and the AI Collaboration Narrative later.
- If something in the brief is genuinely ambiguous, ask me rather than assuming.

Start by asking me anything you need to draft the first prompt: the project scaffold (React + Vite + TypeScript + a mock backend).
```
Because of this setup prompt, Claude Code never built everything at once — every component was scoped and locked in first, before I let it start building. The build itself was split into small, single-concern stages (scaffold → mock data/API → business logic + tests → one UI section at a time → polish), each handed to Claude Code as a narrowly scoped prompt that explicitly stated what *not* to build yet:

| # | Stage | Covers | Maps to |
|---|---|---|---|
| 1 | **Scaffold** | Vite + TS + Tailwind + Vitest + json-server wiring | Foundation |
| 2 | **Mock Data & API Layer** | Vehicle type, seed data, API client, React Query hooks | Foundation |
| 3 | **Business Logic + Unit Tests** | Pure functions: days-in-inventory, aging-stock flag, filter predicates — plus the test suite for them | Backbone for Req 1 & 2 |
| 4 | **Inventory Visualization UI** | Vehicle table/list, filter controls (make/model/age) wired to the business logic | **Requirement 1** |
| 5 | **Aging Stock Prominent Display** | A dedicated highlight — a summary panel/count plus visual flagging in the table, not just a quiet badge | **Requirement 2** |
| 6 | **Actionable Insights UI** | Action-logging modal/drawer, dropdown + note, wired to the mutation hook from Stage 2 | **Requirement 3** |
| 7 | **Observability Implementation** | Logging utility, loading/error UI states, error boundary | Cross-cutting |
| 8 | **Polish Pass** | Accessibility, responsive layout, empty states, edge cases (0 vehicles, all-aging, API down) | Cross-cutting |
| 9 | **README Finalization** | Build/run/test instructions + the **AI Collaboration Narrative** section | Deliverable 2 |
| 10 | **System Design Doc Finalization** | Reconciled every section against what was actually built | Deliverable 1 |
| 11 | **Repo Cleanup & Fresh-Clone Check** | Clean git history; verify `git clone` → install → run → test works with zero tribal knowledge | Deliverable 2 |
| 12 | **Video Script + Recording** | Intro/scenario, design + implementation walkthrough, AI story (1-2 min), live demo, lessons learned | Deliverable 3 |
| 13 | **Final Submission Check** | All three deliverables present, cross-referenced, nothing contradicts anything else | Submission |

That table is the plan from the very first setup prompt, not the final scope — the build grew beyond it once the core three requirements were solid: pagination once the vehicle list got long enough to need it, the insights charts (aging-severity breakdown, severity by make, days-in-inventory distribution), a rule-based recommended-action suggestion for never-reviewed vehicles, and the Add/Remove Vehicle flow so the dashboard could actually be used day-to-day rather than just viewed. Each was its own scoped prompt with its own verification pass, same as everything in the table above.

Prompts specified exact data shapes up front (so they couldn't drift between stages), baked correctness-critical edge cases (like the 90/91-day boundary) directly into instructions for generating sample data, and required date-dependent values to be computed by script rather than by hand. Every prompt ended with an explicit exclusion list, to keep each stage's diff small and reviewable.

Here's the very first prompt I actually handed to Claude Code, to scaffold the project:
```
Scaffold a new project: a React + Vite + TypeScript frontend with a json-server mock backend, in the current directory.

1. Initialize a Vite project using the react-ts template.
2. Install and configure Tailwind CSS (latest stable version) for styling, using whatever the current recommended Vite integration method is.
3. Install and configure Vitest + React Testing Library + @testing-library/jest-dom, wired into package.json scripts.
4. Install and configure ESLint + Prettier for TypeScript/React, with a lint script.
5. Set up a mock backend using json-server:
   - Create /mock-server/db.json containing a single placeholder resource: { "vehicles": [] }
   - Add an npm script "mock-api" that runs json-server watching mock-server/db.json on port 3001
   - Install "concurrently" as a dev dependency and add an npm script "dev:all" that runs the Vite dev server and the mock API together
6. Ensure package.json has these scripts: dev, dev:all, mock-api, build, test, lint
7. Add a .nvmrc pinning Node 20
8. Replace the default Vite starter page with a minimal placeholder: a heading "Dealership Inventory Dashboard" styled with a Tailwind utility class, so we can visually confirm Tailwind is wired up correctly.
9. Write one trivial passing Vitest test that renders the placeholder component and asserts the heading text is present, to confirm the test runner works end-to-end.
10. Initialize git if not already a repo, add a .gitignore appropriate for a Node/Vite project (node_modules, dist, .env, etc.), and make an initial commit: "chore: project scaffold".
11. Create a minimal README.md with: project name and one-line description, prerequisites (Node version), install instructions, and run instructions (explain that `npm run dev:all` runs the frontend and mock API together, and note the ports for each).

Do NOT build any dashboard UI beyond the placeholder heading, do NOT define the vehicle data model yet, do NOT add any business logic or filtering, and do NOT add a routing library. This step is scaffold only.
```
### When Claude pushed back

Two moments stand out where I was about to go off-scope, and Claude redirected me instead of just going along with it.

**Example 1 — wanting to rewrite everything over one stubborn bug.**
After spending too long chasing a bug that was genuinely hard to spot, I told the planning chat I wanted to just rewrite everything that might be related:

> **Me:** "OK, it's not working, it's been too long fixing this one — I want to rewrite everything that might relate to this error."

Claude pushed back instead of just handing me a rewrite:

> **Claude:** "Totally fair to be worn out by this — but 'rewrite everything that might relate' is the wrong move here, for a few concrete reasons, not just process purism:
>
> - You have **verified, working functionality** in Stages 4, 5, and 6 right now. A broad rewrite risks trading one bug for several new ones in code that currently passes every check you've run.
> - We still don't actually **know the root cause**. Rewriting broadly might accidentally fix it without you knowing why — which is a worse outcome for this specific project, since 'I found and fixed X because of Y' is much stronger evidence for your AI Collaboration Narrative than 'I threw it out and it started working.'
> - This is precisely the 'too broad, underspecified' category I'm supposed to stop you from handing to Claude Code — 'everything that might relate' isn't a scope, it's an invitation to touch files that aren't broken.
>
> Before we do anything broader: please just paste the four files here — main dashboard page, `ActionLogDrawer.tsx`, `useVehicles.ts`, `FilterPanel.tsx`. I asked for this last turn and haven't seen them yet. This bug pattern (state quietly resetting after a refetch) has a small number of usual suspects, and I can very likely spot it just by reading the code — genuinely faster at this point than another round of prompting Claude Code blind.
>
> If you'd rather not paste them and want to keep working through Claude Code, here's the narrowest safe version of a 'rewrite,' not a broad one: first, commit or stash whatever currently exists, even if it's broken, so this is trivially reversible. Then give Claude Code a prompt scoped to exactly one thing — rewrite only the filters state management in the main dashboard component, with an explicit list of files it's not allowed to touch unless it stops and tells you why. That keeps the blast radius to one file and forces it to justify touching anything else instead of silently doing so."

Three minutes later, I found the bug — it turned out to be a hot-reload issue, not something that needed a rewrite at all. (This is the same filter-persistence bug described in more detail below.) I'd been thinking way too big.

**Example 2 — six prompts deep into pure UI polish.**
I spent a good amount of time on UI, tweaking and re-tweaking it — six prompts in, still just on the UI — when Claude flagged that I was drifting:

> **Claude:** "If all of that holds, this is a good moment to actually stop touching this component and move forward — you've now got two genuinely strong, well-documented debugging stories for the AI Collaboration Narrative (the Vite watcher/full-reload bug, and this one: three hypotheses formed and eliminated in sequence before a working fix, verified via computed styles rather than assumption)."

Because of the scope and boundaries I'd set up front, Claude knew what actually mattered for the evaluation and redirected me back toward finishing, instead of letting me keep polishing something that wasn't being scored.

### Verifying & refining output

Each stage had a concrete checklist before moving to the next — not "it looks right," but specific checks: the app builds and loads, the test suite and linter pass, a manual write-then-refetch confirms data actually persists rather than just appearing to, and a git commit exists.

Two notable bugs came up mid-build, both found through manual verification rather than the test suite:

- **A drawer rendering ~100px wide instead of full-size**, traced to a naming collision between a custom design token and Tailwind's built-in scale (both used the key `md`), which silently resolved to the wrong value with no build warning. Fixed with an explicit, unambiguous value; confirmed via the browser's computed styles.
- **A filter that silently reset itself** after logging an action, traced (via targeted console logging, not guesswork) to the mock API rewriting its data file inside a folder Vite's dev server also watched — triggering a full page reload, which wiped all in-memory state. Fixed with one line excluding that folder from the watcher.

In both cases, the fix touched only configuration, not application code — finding the real cause rather than patching the visible symptom is what actually resolved them.