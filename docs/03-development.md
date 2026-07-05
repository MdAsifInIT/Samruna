# 3. Development

## 3.1 Setup

Install dependencies:

```powershell
npm install
```

Run the local dev server:

```powershell
npm run demo:dev
```

Open the URL printed by Vite.

For the API-backed local demo, run:

```powershell
npm run backend:seed
npm run dev:fullstack
```

If dev mode fails in a restricted environment:

```powershell
npm run build
npm run preview:fullstack -- --port 4174
```

## 3.2 Build

Build the production artifact:

```powershell
npm run build
```

This runs TypeScript checks first and then builds `dist/`.

The production artifact is the recommended verification target for final demo checks.

## 3.3 Test

Run all tests:

```powershell
npm test
```

Run type checks:

```powershell
npm run typecheck
```

Run dependency audit:

```powershell
npm audit --audit-level=low
```

Run the full non-browser local POC verification gate:

```powershell
npm run verify:demo
npm run verify:fullstack
```

## 3.4 Extend

When adding new behavior, work from domain logic outward:

1. Update contracts in `src/domain/types.ts`.
2. Add or update fixture data.
3. Add or update scenario loading in `src/domain/fixtures.ts`.
4. Add deterministic domain logic.
5. Add tests.
6. Wire dashboard UI and persistence snapshots if state should survive reload.
7. Verify the golden demo path.

Do not begin with UI-only mockups. The product should always demonstrate real typed transformations.

## 3.5 Adding A New Workflow

Example workflows:

- procurement approval
- employee onboarding
- finance exception handling
- vendor review

Implementation steps:

1. Add new request types in `src/domain/types.ts` if the workflow needs them.
2. Add raw traces across at least three channels in `src/fixtures/demoData.ts`.
3. Add policy rules, approval history, and new incoming request data.
4. Add a `DemoScenario` entry with synthetic-data notice, data needs, and excluded data.
5. Extend ingestion inference.
6. Extend pattern grouping and scoring labels.
7. Extend graph nodes if the process path differs.
8. Extend planner rules and simulation classification.
9. Add tests for each changed module.
10. Verify scenario switching in the UI.

## 3.6 Local Persistence

Backend demo state is owned by `server/workspace.ts` and persisted to SQLite at `.wgf/work-graph-foundry.sqlite` by default. Set `WGF_DB_PATH` to use a different local database path. The browser writes a `localStorage` mirror through `src/domain/persistence.ts` for reload resilience and backend-unavailable fallback.

It persists:

- selected scenario
- staged operator flags
- generated graph
- proposals
- governance decisions and records
- simulation result
- execution runs
- recommendations
- audit events

Reset returns the selected scenario to a deterministic seeded baseline. Do not commit generated SQLite databases, browser mirror exports, or run summaries unless they are intentionally added as synthetic documentation examples.

## 3.7 Adding Live OpenAI Calls

The current browser app must not read `OPENAI_API_KEY` or import OpenAI-capable provider code.

Implemented local path:

1. `server/ai.ts` reads `OPENAI_API_KEY`, optional `OPENAI_MODEL`, and optional `OPENAI_TIMEOUT_MS`.
2. `WorkspaceService` receives an injected provider and routes proposal generation through it.
3. `OpenAiResponsesProvider` uses structured JSON output and `store: false`.
4. The service normalizes proposal identity and validates provider output before persistence.
5. Failed provider calls fall back to deterministic mock proposal generation.
6. Health/workspace responses return only non-secret provider metadata.
7. The browser displays provider metadata from the backend snapshot and keeps local fallback mock-only.

Run live proposal generation locally only from the backend process:

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_MODEL="gpt-5.5"
npm run dev:fullstack
```

## 3.8 Adding Enterprise Connectors

Connectors should not be added directly to the browser.

Recommended path:

1. Add connector account configuration on the server.
2. Pull data into a normalized raw trace format.
3. Store source metadata and provenance.
4. Run ingestion against imported traces.
5. Show connector health and sync status.
6. Never execute write actions without governance approval.

## 3.9 Development Rules For Agents

If an agent continues this repo:

- Read `README.md` and all numbered docs first.
- Run `rg --files` to inspect the repo.
- Run the test suite before major changes.
- Preserve the golden path.
- Make deterministic changes first.
- Keep all AI-like outputs typed.
- Update docs when adding new modules or flows.
- Do not remove safety gates to simplify execution.
- Verify reset, import/export, and no committed local state.

## 3.10 Git Hygiene

Ignored files:

- `node_modules/`
- `dist/`
- `.env`
- `.env.local`
- `.vite/`
- `.vitest-attachments/`
- `.wgf/`
- `.codex/`
- `*.sqlite`
- `*.sqlite-shm`
- `*.sqlite-wal`
- `*.log`

Before commit:

```powershell
git status --short
npm run verify:fullstack
```

## 3.11 Common Development Mistakes

Avoid:

- adding untyped JSON blobs
- making live services required for the demo
- exposing secrets to browser code
- bypassing governance before execution
- replacing the dashboard with a chatbot-first UI
- adding broad dependencies for simple deterministic logic
- changing fixture data without updating tests
- committing generated SQLite files, browser mirror exports, or real customer data
