# 12b. Backend Implementation Plan

## 12.1 Purpose

Historical reference: this plan captured the autonomous build instructions for the now-completed demo-grade full-stack version of Work Graph Foundry.

The target outcome was a local backend, local database, seeded synthetic organization records, persisted workflow artifacts, and a frontend flow backed by API calls. The implementation preserved the existing local-first demo behavior, Historical validation engine, governance gate, and safe simulation boundary.

## 12.2 Recommended Tool

Use Codex App with a worktree as the primary tool.

Recommended order:

1. Codex App worktree: best fit for autonomous project management, branch isolation, subagents, local verification, review, and handoff.
2. OpenCode: good fallback because `opencode.json` already defines a build orchestrator and worker agents.
3. Antigravity: useful for visual multi-agent management, but less directly aligned with this repository's existing instructions.

Use branch `backend-branch` for the implementation.

## 12.3 Operating Model

The build should follow the repository's worker-orchestrator model:

- The main thread is the orchestrator and project manager.
- The orchestrator owns architecture, context, integration, review, and final verification.
- Workers own bounded implementation and verification slices.
- Worker output must be reviewed before integration.
- Changes must stay minimal, intentional, and scoped.

Recommended worker split:

- `worker_major`: architecture-sensitive backend API, database schema, and frontend/backend state boundary.
- `worker_nano`: backend implementation, frontend integration, scripts, and docs.
- `worker_test`: tests, verification, and failure triage.

## 12.4 Fresh Codex Prompt

Historical execution prompt, retained for reference:

```text
You are the orchestrator/project manager for Work Graph Foundry.

Goal:
Build a demo-grade full-stack backend implementation from start to finish.

Branch:
Create and work on a git branch named backend-branch. If this is a Codex worktree, create the branch in this worktree. Do not check out backend-branch in another worktree at the same time. If backend-branch already exists and is unavailable because another worktree owns it, stop and report that exact blocker.

Repository:
C:\Users\Primary\Documents\Work Graph Foundry

Operating model:
Use the repo's worker-orchestrator model from AGENTS.md. The main thread is the orchestrator. Delegate bounded work to subagents. Do not implement everything directly in one pass.

Use:
- worker_major for architecture-sensitive backend/API/schema decisions.
- worker_nano for bounded implementation slices.
- worker_test for tests, verification, and failure triage.

Read first:
- AGENTS.md
- README.md
- package.json
- opencode.json
- docs/02-architecture.md
- docs/05-data-access-and-security.md
- docs/07-roadmap.md
- docs/09-agentic-build-guide.md
- src/domain/types.ts
- src/domain/persistence.ts
- src/app/useWorkGraphDemoController.ts
- src/fixtures/demoData.ts

Scope:
Implement a demo-grade full-stack version:
- local backend API
- local database
- organization records
- persisted traces, proposals, governance records, audits, execution runs, and learning recommendations
- frontend flow backed by API calls
- deterministic seeded synthetic organization data

Out of scope:
- real enterprise connectors
- real provisioning
- production auth/RBAC
- real customer data
- browser-side secrets
- live write actions to external systems

Architecture defaults:
Use TypeScript. Prefer a lightweight Node backend. Use Node 24 and built-in node:sqlite if practical. Keep dependencies minimal. Use existing domain modules where possible instead of duplicating business logic.

Required implementation sequence:
1. Ask worker_major to design the minimal backend API contract, DB schema, and frontend/backend state boundary.
2. Ask worker_nano to implement backend server, DB bootstrap, seed, reset, and route tests.
3. Ask worker_nano to implement frontend API client and update the controller to use backend/API-backed state.
4. Ask worker_nano to update scripts, docs, and gitignore rules for generated DB files.
5. Ask worker_test to run verification and triage failures.

Backend requirements:
- Place backend code under server/.
- Store generated SQLite DB files in an ignored local path.
- Provide seed/reset behavior.
- Add /api/health.
- Add organization/scenario loading routes.
- Add workflow action routes for load, analyze, generate proposal, governance decision, execute workflow, reset, export, and import.
- Persist server-side state for the demo run.
- Keep execution in safe simulation mode.

Frontend requirements:
- Preserve existing landing-first UI.
- Preserve #demo workspace behavior.
- Preserve current scenario flow and five views.
- Add backend loading and error states only where necessary.
- Do not redesign the app.
- Keep local fallback only if needed for tests, and document it.

Data requirements:
- Seed one realistic synthetic organization.
- Include IT access and procurement scenarios under that organization.
- Clearly label all seeded organization data as synthetic.
- Do not add real companies, real employee records, credentials, or secrets.

Testing requirements:
Run and fix until passing where environment allows:
- npm run typecheck
- npm test
- npm run build
- npm run test:backend
- npm run verify:fullstack
- npm run typecheck:e2e if e2e TypeScript changes
- npm run test:e2e when Chromium is available
- npm run test:e2e:preview when Chromium is available

If Playwright browser launch is blocked, record the exact command and blocker.

Docs requirements:
Add docs/12-fullstack-demo-plan.md.
Update README or demo docs with:
- full-stack run commands
- backend architecture
- DB seed/reset behavior
- API-backed flow
- what is real vs safely simulated
- verification commands

Final requirements:
- Stay on branch backend-branch.
- Commit only intentional source, docs, scripts, tests, and config changes.
- Do not commit generated DB files, logs, dist, node_modules, test-results, or secrets.
- Final response must include:
  - branch name
  - subagents used
  - summary of changed files
  - exact verification commands and results
  - blockers, if any
  - explicit note that enterprise connectors and real execution remain safely simulated
```

## 12.5 Backend Requirements

The implementation should add a local TypeScript backend under `server/`.

The backend should:

- expose API routes under `/api`
- use a local SQLite database
- seed one synthetic organization
- load scenarios and fixture-backed work traces
- persist proposals, simulation results, governance records, audit events, execution runs, and learning recommendations
- provide deterministic reset and export/import behavior
- reuse existing domain modules wherever practical

The backend must not:

- connect to real enterprise systems
- perform real provisioning
- require production authentication
- expose secrets to browser code
- commit generated database files

## 12.6 Frontend Requirements

The frontend should read and write through backend APIs while preserving the existing product experience.

Preserve:

- landing-first entry
- `#demo` workspace
- five workspace views
- IT access and procurement scenarios
- proposal generation
- simulation
- governance approval and rejection
- approval-gated safe simulated execution
- audit export/import/reset behavior

Add only the loading and error states required for the backend/API-backed flow.

## 12.7 Data Requirements

Seed one realistic synthetic organization.

The seeded organization should include:

- departments
- requesters
- approvers
- source systems
- approval history
- work traces
- policies
- IT access scenario
- procurement scenario

All organization data must be synthetic. Do not add real customer data, real employee records, credentials, API keys, or private production artifacts.

## 12.8 Scripts And Verification

Add or update scripts so a reviewer can run:

```powershell
npm install
npm run backend:seed
npm run dev:fullstack
npm run test:backend
npm run verify:fullstack
```

Required verification for the backend branch:

```powershell
npm run typecheck
npm test
npm run build
npm run test:backend
npm run verify:fullstack
```

Run these when relevant or when browser launch is available:

```powershell
npm run typecheck:e2e
npm run test:e2e
npm run test:e2e:preview
```

If Playwright is blocked by local browser permissions, record the exact blocker and continue with non-browser verification.

## 12.9 Assumptions

- Codex App worktree is the primary autonomous build environment.
- `backend-branch` is the implementation branch.
- SQLite is acceptable for demo-grade local persistence.
- Organization data remains synthetic.
- Live OpenAI calls are not required.
- Enterprise connectors and real execution remain out of scope.
- The backend build can add small npm dependencies when justified, but should keep the stack minimal.
