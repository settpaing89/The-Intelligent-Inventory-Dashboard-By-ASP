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
