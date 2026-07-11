# Dealership Inventory Dashboard

A React + TypeScript + Vite frontend for managing dealership vehicle inventory, backed by a json-server mock API during development.

## Prerequisites

- Node 20 (see `.nvmrc`)

## Install

```bash
npm install
```

## Run

```bash
npm run dev:all
```

This runs the Vite dev server and the mock API together:

- Frontend (Vite): http://localhost:5173
- Mock API (json-server): http://localhost:3001

You can also run them separately with `npm run dev` (frontend only) and `npm run mock-api` (mock API only).

## Other scripts

- `npm run build` — type-check and build for production
- `npm run test` — run the Vitest test suite
- `npm run lint` — run ESLint
- `npm run format` — format the codebase with Prettier

## AI Collaboration Narrative

*(Living section — updated as each build stage completes. Current coverage: Stages 1-2.)*
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