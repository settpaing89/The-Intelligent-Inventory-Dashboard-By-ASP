# Intelligent Inventory Dashboard

## Overview

The Intelligent Inventory Dashboard gives dealership managers visibility into aging vehicle stock and a concrete way to act on it, rather than leaving that judgment to memory or a spreadsheet. It was built for the Keyloop technical assessment, Scenario B (Domain: Supply). Per the assessment's "choose one layer" instruction, the frontend is fully implemented and the backend is mocked — but the mock is a real, working REST API (json-server) with file-based persistence, not a static fixture or an in-memory stub. That distinction matters because a manager's logged action genuinely persists to disk and survives a page reload, rather than only appearing to save. Three core requirements shape everything that follows: inventory visualization and filtering, aging-stock identification, and actionable insights and logging.

## Features

### Inventory visualization and filtering

- A paginated vehicle table (make/model, year/trim, days in inventory, price, status, and action columns), with an expandable row for VIN, color, mileage, and intake date.
- Filtering by make, model, year, VIN substring, and a min/max days-in-inventory range.
- Summary stats for total vehicle count, aging-stock count, average days in inventory, and total inventory value.

### Aging-stock identification

- A two-tier severity model: **aging** (more than 90 days in inventory) and **critical** (more than 150 days), each with its own badge.
- An aging-stock summary banner above the fold, with a one-click filter into just the aging and critical vehicles.
- Charts covering the aging-severity breakdown, severity by make, and the days-in-inventory distribution.

### Actionable insights and logging

- Logging or updating a status and optional note against any aging or critical vehicle, persisted through the mock API.
- A rule-based recommended-action suggestion, pre-filled for a vehicle that has never been reviewed and clearly captioned as a suggestion rather than a manager's own prior decision.

### Beyond the core requirements

The following were added on top of the three core requirements above, not required by the assessment. Each is a deliberate addition, not scope drift — see `SYSTEM_DESIGN.md` for the full reasoning behind each one.

- **Pagination** — the vehicle list can grow past what's comfortable to render and scroll through on one page.
- **The recommended-action heuristic** — reduces a manager's decision load on a never-reviewed vehicle without pretending to be their own past judgment.
- **Add Vehicle and Remove Vehicle** — a dashboard that can only display inventory but never adjust it has limited practical use for day-to-day work.
- **A custom visual design system** — `DESIGN.md`'s token spec is applied consistently across every component, rather than leaving the interface in default component styling.

## Prerequisites

- Node 20 (see `.nvmrc`)

## Installation

```bash
npm install
```

## Environment setup

`.env.example` documents the one variable the app reads, `VITE_API_BASE_URL`. The app already defaults to `http://localhost:3001` in code if the variable is unset, matching the mock API's own default port, so no `.env` file is required to run the project out of the box. Copy `.env.example` to `.env` only if you need to point the frontend at a different backend URL.

## Running the application

```bash
npm run dev:all
```

This runs the Vite dev server and the mock API together:

- Frontend (Vite): http://localhost:5173
- Mock API (json-server): http://localhost:3001

You can also run them separately with `npm run dev` (frontend only) and `npm run mock-api` (mock API only).

## Testing

The business logic layer (`src/lib/inventoryLogic.ts`) is deliberately written as pure functions with no React or network dependencies — no component rendering, no API calls, just plain data in and plain data out. That isolation is why it's testable the way it is: a test can assert on an exact input/output pair directly, without mocking a UI or a server to get there.

### Testing approach

- **Boundary-value testing at the exact thresholds the app's logic depends on** — 90 versus 91 days (the aging boundary) and 150 versus 151 days (the critical boundary). Testing directly at a boundary is what actually exercises a `>` versus `>=` decision in the implementation; a test comfortably on either side of it would still pass even if that comparison operator were wrong.
- **Deterministic dates via an injectable `asOfDate`** — every date-dependent function takes an optional `asOfDate` parameter (defaulting to `new Date()` in production, but always passed explicitly as a fixed reference date in tests) so a test's result doesn't depend on what day it happens to run.
- **Defensive and edge-case coverage** — empty arrays, zero and negative values, future dates, and malformed input are tested throughout, deliberately rather than incidentally, since these are exactly the inputs a real browser can produce (an empty inventory, a vehicle with a future intake date, a manager submitting a mistyped VIN).
- **Non-mutation checks** — several functions that operate on a vehicle array (`filterVehicles`, `getAgingVehicles`, `paginateVehicles`, `getSeverityBreakdownByMake`) have a dedicated test confirming the input array and its elements are left untouched.

### Coverage

- Days-in-inventory and severity threshold logic (`getDaysInInventory`, `isAgingStock`, `getAgingSeverity`).
- Make/model/year/VIN/day-range filtering (`filterVehicles`), including the convention that an empty string or `undefined` filter value means "no active filter," not "match nothing."
- Pagination bounds and clamping (`paginateVehicles`): exact-multiple and remainder page splits, and clamping an out-of-range page number — too high, or below 1 — back into range.
- Aggregate stats (`getAverageDaysInInventory`, `getTotalInventoryValue`, `getAgingVehicles`) and the chart-supporting aggregations behind `InventoryInsights` (`getSeverityBreakdownByMake`, `getDaysInInventoryDistribution`), including sort order and that a make with zero aging or critical vehicles still appears rather than being silently dropped.
- The recommended-action heuristic (`getRecommendedAction`).
- New-vehicle validation (`validateNewVehicle`): required fields, numeric and date bounds, VIN format (length, character set, the I/O/Q exclusion) and case-insensitive uniqueness against existing inventory, and that every applicable validation error is reported at once rather than stopping at the first one found.

```bash
npm run test
```

This currently runs 85 tests across 2 files: 84 in `src/lib/inventoryLogic.test.ts` covering the business logic above, plus 1 smoke test in `src/App.test.tsx` (renders the app and confirms the page heading appears) left over from the initial scaffold.

```bash
npm run lint
```

Runs ESLint across the project.

### What this suite does not cover

Component rendering and end-to-end user flows are not covered by this automated suite, beyond the single scaffold-era smoke test above. That was a deliberate scope decision, not a gap: UI behavior was verified manually at each build stage against an explicit checklist before moving to the next one, as described in the AI Collaboration Narrative below, rather than adding browser-automation tooling that would have been disproportionate to a project of this size.

## Project structure

- `src/lib` — framework-independent business logic (aging/severity calculations, filtering, pagination, new-vehicle validation), fully unit-tested and with no React or DOM dependencies.
- `src/components` — the React UI, one component per major dashboard section or interaction (table, filters, drawers, charts, dialogs).
- `src/api` — fetch wrappers around the mock REST API.
- `src/hooks` — TanStack Query hooks (queries and mutations) built on top of the `src/api` layer.
- `mock-server/` — the json-server mock backend and its file-persisted `db.json` seed data.

## AI Collaboration Narrative

*(Living section — updated as each build stage completes. Current coverage: Stages 1-2.)*
### A Debugging Case Study: The 16px Drawer

After the visual reskin, `ActionLogDrawer` began rendering at roughly 100-120px
wide on every viewport — not just small screens — cutting off all its content.
This one took three specific, falsifiable hypotheses before landing on the real
cause, and it's worth documenting precisely *because* most of them were wrong.

**Hypothesis 1: a CSS containing-block issue.** The standard explanation for a
`position: fixed` element sizing against the wrong box is an ancestor with a
`transform`, `filter`, or similar property creating a new containing block. I
had the AI search the entire codebase for every property known to cause this.
None were found on any ancestor — the only matches were on unrelated sibling
components. Hypothesis eliminated with an actual search, not assumption.

**Hypothesis 2: a Tailwind config collision on `maxWidth`.** Since a custom
design-token extension had just been added to `tailwind.config.js`, the next
theory was that it had accidentally overwritten Tailwind's `maxWidth` scale.
Reviewing the actual config file showed no `maxWidth` key was touched at all.
Hypothesis eliminated.

**Hypothesis 3: a stale browser cache.** Ruled out directly via hard refresh
and an incognito window — the bug persisted regardless.

**Applying a fix before having full certainty.** At that point, rather than
keep guessing, I had the AI apply a change that would work regardless of the
underlying cause: swapping the named `sm:max-w-md` utility for an explicit
arbitrary value, `sm:w-[28rem]` — arbitrary values bypass Tailwind's
theme-scale lookup entirely, so they can't collide with anything. This fixed
the visible bug immediately, confirmed via the browser's Computed panel
showing exactly `448px` (28rem) rather than just eyeballing the screen.

**Confirming the actual root cause afterward.** A working fix without a
diagnosis felt incomplete, so I asked for one more test: temporarily strip the
custom spacing-token block from the config, revert to the named `max-w-md`
class, and see if it now resolved correctly on its own. It did. The compiled
CSS proved it directly — with the custom tokens present:
`.sm\:max-w-md { max-width: 16px }`; with them removed:
`.sm\:max-w-md { max-width: var(--container-md) }` (28rem, correct).

**Root cause:** the design system's spacing tokens were deliberately named
`sm`/`md`/`lg`/`xl` to match `DESIGN.md`'s own naming. Tailwind's independent
`maxWidth`/container scale uses those exact same key names by default
(`24rem`/`28rem`/`32rem`/`36rem`). Under this project's Tailwind v4 +
`@config` (legacy JS-config compatibility) setup, the two scales resolved
through a shared key namespace, and the custom spacing values silently won —
so `max-w-md` quietly became `16px` instead of `28rem`, with no warning
anywhere in the build.

**Why this is worth including:** three specific hypotheses were tested and
eliminated with real evidence — a codebase search, a config review, a cache
check — before the actual cause was found. Just as importantly, a working fix
was shipped and verified via computed styles *before* the root cause was fully
confirmed, rather than leaving a visibly broken component in place while the
investigation continued. It also surfaced a systemic risk beyond this one
component: any future utility class anywhere in this codebase using a scale
name that collides with the design tokens (`sm`, `md`, `lg`, `xl`, `xs`,
`base`, `gutter`, `margin`) would silently resolve to the wrong value with no
build error — flagged in the System Design Document as a known constraint for
anyone extending the styling later.

### A Debugging Case Study: The Vanishing Filter

After Stage 6 (action logging), I found a bug during my own manual verification, not
the test suite: apply a filter, log an action on a vehicle through the drawer, submit
— and the filter would silently reset, showing the full unfiltered list again.

**First hypothesis: a state-management bug.** The obvious suspects were the drawer's
close/success handler, the mutation's `onSuccess`, or the derived make/model lists
resetting filters as a side effect. I had the AI read the actual implementation of
each of those files rather than guess at a fix — all three were clean. The drawer's
success handler only called `onClose()`; the mutation's `onSuccess` only invalidated
the query; nothing touched filter state. That ruled out the most likely files without
needing to trace the bug further at that point.

**A dead end, and a deliberate scope decision.** Next, the AI tried to reproduce the
bug in jsdom to isolate it further, repeatedly, without success, and proposed adding
Playwright to drive a real browser instead. I said no — installing a browser-automation
framework to chase one UI bug was disproportionate scope for this project, and would
have left an unexplained testing dependency in a submission that's supposed to read as
deliberate and scoped. I asked for a lighter diagnostic instead: temporary, clearly
labeled console logging at every call site that could touch filter state, reproduced
once manually in the actual browser.

**The actual clue was in the trace, not the code.** The console log showed filters
surviving the entire submit → close → invalidate → refetch cycle correctly — right up
until a line that read `Navigated to http://localhost:5173/`. That's a real browser
navigation event, not a React re-render, and it's what was wiping every in-memory
`useState`, filters included. Every hypothesis about the React code had been correct
in ruling itself out; the bug wasn't in React state management at all.

**Root cause:** `mock-server/db.json` sits inside the same directory tree Vite's dev
server watches by default. Every time json-server persisted an action update, it
rewrote that file on disk. Vite's watcher saw a file change it couldn't hot-reload
and fell back to a full page reload — reloading the entire app, and with it, every
piece of in-memory state, on every single action submission.

**Fix:** exclude the mock-backend directory from Vite's dev-server watcher
(`server.watch.ignored` in `vite.config.ts`), leaving json-server's own separate
`--watch` flag on `db.json` untouched. One config line.

**Why this is worth including here:** the eventual fix touched zero application code
— not the component that displayed the symptom, not the state it appeared to be
losing. Treating a symptom as evidence to trace rather than a location to patch is
what actually found it; a faster "just reset filters back after any mutation"
workaround would have papered over a real full-page-reload problem that could have
resurfaced anywhere else in the app.
### High-Level Strategy

I used a two-agent workflow rather than a single AI/code loop: Claude (chat) as a
dedicated spec-and-decision partner, and Claude Code as the implementation agent —
kept deliberately separate so ambiguity gets resolved *before* code is written, not
discovered mid-generation. For every decision with more than one reasonable answer
(mock-backend architecture, styling approach, state-management library, data model
shape, how the manager's action gets captured), the trade-offs of each option were
surfaced explicitly, I made the call, and only then was that decision turned into a
prompt. Claude Code never made an architectural decision on my behalf — it executed
decisions I'd already locked.

The build was broken into small, single-concern stages (scaffold → mock data/API →
business logic + tests → UI split one-per-requirement → observability → polish),
each handed to Claude Code as its own narrowly scoped prompt that explicitly states
what *not* to build yet, to prevent scope creep and keep each stage independently
verifiable before the next one starts.

### Directing the AI

Each prompt was written to remove ambiguity the AI would otherwise have had to guess at:

- Exact TypeScript interfaces were specified verbatim in the prompt rather than left
  for the agent to invent, so the data shape couldn't drift between stages.
- Correctness-critical edge cases (e.g. the exactly-90-day / exactly-91-day
  aging-stock boundary) were written directly into the seed-data generation
  instructions, so the case that actually matters for the business logic exists in
  the data rather than being left to chance.
- Where a value depended on the current date, the prompt explicitly required the
  agent to compute it with a real script rather than by hand, removing an obvious
  source of arithmetic error.
- Every prompt ended with an explicit exclusion list ("do NOT implement X/Y/Z yet")
  to keep each stage's diff small and reviewable.

### Verifying & Refining Output

Each stage had a concrete verification checklist run before moving to the next —
not "it looks right," but specific checks:

- **Scaffold:** app builds and loads with the styled placeholder, mock API returns
  an empty array, test suite passes, lint is clean, a git commit exists.
- **Mock data/API layer:** UI shows the correct vehicle count; the terminal-printed
  boundary dates for the exactly-90/91-day vehicles were checked against the actual
  calendar date; a raw `curl` GET confirmed the response shape matched the spec; a
  manual `curl` PATCH followed by a re-fetch confirmed writes actually persist to
  `db.json`, not just appear to succeed in memory.

<!-- Add specific examples here: any point where Claude Code's output needed
correction, deviated from the prompt, or where you caught something during
verification that wasn't obvious from just running the app. Concrete examples
are stronger evidence here than describing the process in the abstract. -->

### Ensuring Final Code Quality

- TypeScript throughout, with data-shape contracts defined once and imported
  everywhere, rather than re-declared per file.
- Business logic (Stage 3) will be written as pure, framework-independent functions
  specifically so they can be unit-tested directly against the boundary cases
  already baked into the seed data, rather than only exercised indirectly through
  the UI.
- Every implementation prompt traces back to a specific requirement or a decision
  already recorded in the System Design Document — nothing was generated
  speculatively "in case it's useful."
- *(To be extended once Stage 3's test suite exists — that's the stage this project
  is weighted most heavily on, so its verification will go beyond "tests pass" to
  actually reviewing what each test asserts.)*