# 12. Full-Stack Demo Plan

Current reference: this plan documents the demo-grade full-stack backend implementation and the resulting local runtime.

## Purpose

The current full-stack demo adds a demo-grade local backend to Work Graph Foundry while preserving the existing reproducible product demo.

The backend is local-only. It is meant for reviewers and developers who want to evaluate an API-backed flow with durable local state, not for production use.

## Runtime

- Frontend: React, Vite, TypeScript.
- Backend: TypeScript on Node 24.
- Database: local SQLite through Node's built-in `node:sqlite`.
- Default backend URL: `http://127.0.0.1:8787`.
- Default database path: `.wgf/work-graph-foundry.sqlite`.

Override the database path with:

```powershell
$env:WGF_DB_PATH="C:\tmp\work-graph-foundry.sqlite"
```

Generated databases and SQLite sidecar files are ignored by git.

## Architecture

The backend owns the demo workspace state. It is the primary persistence layer, and the browser keeps a mirror for reload recovery and local fallback. It persists the same typed state shape the browser demo already used:

- selected scenario
- staged workflow flags
- generated graph
- proposals and selected proposal version
- simulation
- governance records
- execution runs
- learning recommendations
- audit events

Immutable synthetic scenario data still comes from `src/fixtures/demoData.ts`. Mutable run artifacts are persisted in SQLite as typed JSON snapshots and mirrored into an artifacts table for backend verification.

The frontend calls `/api/workspace` routes when the backend is available. It keeps a local browser mirror as a fallback for unit tests and backend-unavailable development, but the full-stack path treats the backend as authoritative and the browser state as a mirror only.

## API Routes

Routes are exposed under `/api` and use this response envelope:

```json
{ "ok": true, "data": {} }
```

or:

```json
{ "ok": false, "error": { "code": "string", "message": "string" } }
```

Implemented routes:

- `GET /api/health`
- `GET /api/scenarios`
- `GET /api/workspace`
- `POST /api/workspace/scenario`
- `POST /api/workspace/load`
- `POST /api/workspace/analyze`
- `POST /api/workspace/proposals`
- `POST /api/workspace/proposals/select`
- `POST /api/workspace/governance`
- `POST /api/workspace/run`
- `POST /api/workspace/reset`
- `GET /api/workspace/export`
- `POST /api/workspace/import`
- `GET /api/workspace/audit`

## Commands

Install dependencies:

```powershell
npm install
```

Seed or reset the local backend state:

```powershell
npm run backend:seed
npm run backend:reset
```

Run backend only:

```powershell
npm run backend:dev
```

Run full-stack development mode:

```powershell
npm run dev:fullstack
```

If Vite dependency optimization is blocked by a local sandbox, use the built full-stack server instead:

```powershell
npm run build
npm run preview:fullstack -- --port 4174
```

Build and serve the static app through the backend:

```powershell
npm run build
npm run preview:fullstack -- --port 4174
```

## Verification

Required checks:

```powershell
npm run typecheck
npm test
npm run test:backend
npm run build
npm run verify:fullstack
```

Browser checks when Chromium is available:

```powershell
npm run typecheck:e2e
npm run test:e2e
npm run test:e2e:preview
```

## What Is Real vs Simulated

Real in this branch:

- local backend API
- local SQLite persistence
- deterministic seed/reset
- persisted proposals, simulations, governance records, executions, recommendations, and audit events
- API-backed frontend workflow when the backend is available

Still simulated or out of scope:

- enterprise connectors
- production authentication or RBAC
- live provisioning
- live writes to enterprise systems
- real customer data
- browser-side secrets
- production-hosted OpenAI deployment and live-key CI

Optional live OpenAI proposal generation is backend-only. Execution remains in safe simulation mode and approval-gated.
