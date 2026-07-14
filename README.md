# Intelligent Inventory Dashboard

## Overview

A dashboard for car dealership managers to see which vehicles have been sitting in inventory too long, and to log what they're doing about it - instead of relying on memory or a spreadsheet.

Built for a technical assessment (Keyloop, Scenario B, Supply domain). The assessment allowed choosing one layer to build in full - this project fully builds the **frontend**, with a simplified but fully working backend (data really saves to a file; a logged action survives a page reload).

Architecture, technology choices, and observability strategy are covered separately in `SYSTEM_DESIGN.md`. This README focuses on running, testing, and the AI collaboration process.

## Features

- **Browse & filter inventory** — searchable, paginated vehicle table with expandable detail rows (VIN, color, mileage, intake date).
- **Aging-stock detection** — vehicles auto-flagged as **aging** (90+ days) or **critical** (150+ days), with a summary banner and charts.
- **Action logging** — log a status + optional note against any aging/critical vehicle, saved persistently. A rule-based suggested action is shown for vehicles never reviewed.
- **Add/remove vehicles** - so the dashboard can actually be used day-to-day, not just viewed.

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

No setup is required to run this out of the box - the app defaults to the correct API address automatically. Only edit `.env` (see `.env.example`) if pointing at a different backend URL.

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

Component rendering and end-to-end UI flows aren't covered by automated tests, beyond the one scaffold-era smoke test. This was a deliberate scope decision: UI behavior was verified manually at each build stage against an explicit checklist (below), rather than adding browser-automation tooling that would have been disproportionate to a project of this size.

## Project Structure

- `src/lib` — framework-independent business logic, fully unit-tested.
- `src/components` — the React UI, one component per dashboard section.
- `src/api` — fetch wrappers around the mock API.
- `src/hooks` — TanStack Query hooks built on the API layer.
- `mock-server/` — the json-server mock backend and its seed data.

## AI Collaboration Narrative

### High-level strategy

Two AI assistants, two separate jobs: Claude (chat) as a **planning partner** to think through trade-offs and lock in decisions before any code was written, and Claude Code as the **builder**, which only implemented decisions already made — it never made an architectural call on its own.

The build was split into small, single-concern stages (scaffold → mock data/API → business logic + tests → one UI section at a time → polish), each handed to Claude Code as a narrowly scoped prompt that explicitly stated what *not* to build yet.

Prompts specified exact data shapes up front (so they couldn't drift between stages), baked correctness-critical edge cases (like the 90/91-day boundary) directly into instructions for generating sample data, and required date-dependent values to be computed by script rather than by hand. Every prompt ended with an explicit exclusion list to keep each stage's diff small and reviewable.

### Verifying & refining output

Each stage had a concrete checklist before moving to the next — not "it looks right," but specific checks: the app builds and loads, the test suite and linter pass, a manual write-then-refetch confirms data actually persists rather than just appearing to, and a git commit exists.

Two notable bugs came up mid-build, both found through manual verification rather than the test suite:

- **A drawer rendering ~100px wide instead of full-size**, traced to a naming collision between a custom design token and Tailwind's built-in scale (both used the key `md`), which silently resolved to the wrong value with no build warning. Fixed with an explicit, unambiguous value; confirmed via the browser's computed styles.
- **A filter that silently reset itself** after logging an action, traced (via targeted console logging, not guesswork) to the mock API rewriting its data file inside a folder Vite's dev server also watched — triggering a full page reload, which wiped all in-memory state. Fixed with one line excluding that folder from the watcher.

In both cases, the fix touched only configuration, not application code — finding the real cause rather than patching the visible symptom is what actually resolved them.
