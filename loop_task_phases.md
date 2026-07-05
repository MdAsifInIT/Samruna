# Live OpenAI Integration Loop

## Summary

This file controls the recursive implementation loop for live OpenAI proposal generation in Work Graph Foundry on `backend-branch`.

The target is production-parity model integration through the trusted local backend while preserving the synthetic-data demo, SQLite state, governance gate, browser fallback mirror, and mock-only enterprise execution.

## Non-Negotiable Boundaries

- No enterprise data connectors.
- No authentication or RBAC.
- No live infrastructure provisioning.
- No real customer data.
- No browser-side secrets.
- No real enterprise write actions.
- All OpenAI API keys stay server-side in environment variables or future secret management.
- All model output is validated before persistence.
- Failed live model calls fall back to deterministic mock proposal generation.
- Every execution pass updates this file and `tasks.md`.

## Current Baseline

- The app is a full-stack local demo with React, Vite, Node 24, `node:sqlite`, and `/api/workspace` state.
- The backend owns workspace state, seed/reset, import/export, governance, execution gating, and artifact persistence.
- Proposal generation is now routed through an injected AI provider on the backend.
- `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_TIMEOUT_MS` are read only by `server/ai.ts`.
- The browser displays backend-supplied provider metadata and does not import the OpenAI-capable provider.

## Phase 1: Backend Live OpenAI Proposal Path

### Objective

Route proposal generation through a server-owned AI provider contract with safe defaults.

### Agent Assignments

- `worker_major`: architecture and secret-boundary review.
- `worker_nano`: planning/log file setup.
- `worker_test`: final verification and failure triage.

### Implementation Tasks

- Inject `AiProvider` into `WorkspaceService`.
- Default to deterministic mock provider when no server-side key is configured.
- Build server-only provider config from `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_TIMEOUT_MS`.
- Set OpenAI Responses API requests to `store: false`.
- Normalize provider proposals to stable scenario/pattern/version/timestamp identity before persistence.
- Persist non-secret provider metadata and model invocation provenance.
- Add fallback metadata and audit events when live generation fails.
- Add tests for provider injection, fallback, metadata, structured output rejection, and secret-free API envelopes.

### Completion Gate

- No-key behavior remains deterministic.
- Live provider can be injected and observed through non-secret metadata.
- Failed provider calls fall back without breaking proposal/governance/run flow.
- Browser source no longer imports the OpenAI-capable provider module.

## Phase 2: Reviewer-Ready Production-Parity Layer

### Objective

Make the live integration clear to hackathon reviewers without overstating enterprise readiness.

### Implementation Tasks

- Surface provider mode/model/last generation status in the existing Overview view.
- Keep execution copy explicitly mock-only.
- Document the server-only live-key run path.
- Document that live model reasoning uses synthetic data and mock enterprise execution.
- Keep browser fallback described as a mirror, not the source of truth.

### Completion Gate

- Reviewer can distinguish live proposal generation from mock execution.
- Docs state that connectors, RBAC, provisioning, real customer data, and browser-side secrets remain out of scope.
- Non-browser verification passes without requiring an OpenAI key.

## Recursive Phase Schema

Append future phases using this schema:

```md
## Phase N: <Title>

### Objective
<One concrete outcome.>

### Trigger
<Planned milestone, reviewer finding, failing test, demo gap, security gap, or customer-readiness gap.>

### Agent Assignments
- worker_major:
- worker_nano:
- worker_test:
- Hackathon Reviewer worker_major:

### In Scope
-

### Out Of Scope
-

### Implementation Tasks
-

### API / Data Contract Changes
-

### Security And Secret Boundary
-

### Tests And Verification
-

### Hackathon Reviewer Report
- Score before: <0-100>
- Score after: <0-100>
- Blocking findings:
- Non-blocking findings:
- Customer confidence notes:

### Orchestrator Adaptation Log
- Added tasks:
- Deferred tasks:
- New phases created:
- Rationale:

### Completion Gate
-

### Append Log
- Date:
- Branch:
- Agents used:
- Files changed:
- Commands run:
- Results:
- Blockers:
```

## Append Log

### 2026-07-05: Phase 1 And Phase 2 Implementation Pass

- Branch: `backend-branch`
- Agents used: `worker_major` architecture review, `worker_nano` planning/log setup, `worker_test` verification.
- Status: complete for non-browser gates.
- Files changed: backend provider wiring, shared DTOs/persistence, frontend provider status display, tests, docs, and this loop ledger.
- Results:
  - `npm run typecheck:server` passed.
  - `npm test -- --run src/ai/providers.test.ts src/domain/persistence.test.ts` passed.
  - `npm run test:backend` passed, 20 tests.
  - `npm run typecheck` passed.
  - `npm test` passed, 62 tests.
  - `npm run typecheck:e2e` passed.
  - `npm run build` passed.
  - `npm run verify:fullstack` passed and `npm audit --audit-level=low` found 0 vulnerabilities.
  - Direct full-stack HTTP smoke with temp `WGF_DB_PATH` passed.
  - Production `dist/` scan found no `OPENAI_API_KEY`, `Bearer `, OpenAI endpoint, or OpenAI provider strings.
- Blockers: `npm run test:e2e -- --max-failures=1` built successfully, then Playwright Chromium failed before app assertions with `browserType.launch: spawn EPERM` for `C:\Users\Primary\AppData\Local\ms-playwright\chromium_headless_shell-1228\chrome-headless-shell-win64\chrome-headless-shell.exe`.
- Hackathon Reviewer score: 91/100 after stale full-stack plan wording was corrected. No blocking findings remain.

### 2026-07-05: Frontend Confidence Hardening Pass

- Branch: `backend-branch`
- Agents used: `worker_major` read-only hackathon/customer-confidence reviewer; implementation and integration in the main orchestrator thread; `worker_test` pending final verification.
- Reviewer score before edits: 76/100.
- Blocking findings:
  - Browser-generated mock proposal state could misrepresent backend provider provenance.
  - Happy-path UI did not clearly show backend-connected vs browser fallback mode.
- Implementation tasks completed:
  - Made backend workspace snapshots authoritative for frontend actions when backend is available.
  - Kept local deterministic updates only for browser fallback mode and labeled that mode visibly.
  - Added provider/source-of-truth strip, sanitized fallback status, proposal provider provenance, and retry/reset affordances.
  - Renamed the execution CTA to `Run mock simulation` and added no-enterprise-write copy.
  - Added production frontend secret scan coverage for browser bundle and app source.
- Verification results:
  - `npm run typecheck` passed.
  - `npm test` passed, 64 tests.
  - `npm run test:backend` passed, 20 tests.
  - `npm run build` passed.
  - `npm run scan:frontend-secrets` passed.
  - `npm run verify:fullstack` passed, including 0 vulnerabilities.
  - `npm run typecheck:e2e` passed.
  - `npm run test:e2e` passed, 12 Chromium tests.
  - `npm run test:e2e:preview` passed, 12 Chromium tests.
  - `git diff --check` passed with Windows line-ending warnings only.
- Blockers: none for this pass.
- Final reviewer follow-up:
  - `worker_major` final read-only score after the main hardening pass was 88/100 with no blocking findings.
  - The remaining fast-action `connecting` fallback risk was addressed by attempting backend actions before fallback during initial connection.
  - The source secret-scan coverage risk was addressed by adding browser-shared `src/domain` and `src/fixtures` roots.
  - Final expected readiness after follow-up fixes: 91/100; no blocking findings known.

### 2026-07-05: Backend-Backed Frontend API Authority Pass

- Branch: `backend-branch`
- Agents used: `worker_major` API-boundary review, `worker_nano` bounded gap scan, `worker_test` verification.
- Trigger: user requested implementation of the backend-backed frontend API flow plan and a reviewer pass found that the frontend stored backend state but still rendered several locally recomputed artifacts.
- Files changed:
  - `src/app/useWorkGraphDemoController.ts`
  - `tsconfig.app.json`
  - `tasks.md`
  - `loop_task_phases.md`
- Implementation tasks completed:
  - Retained the latest backend `WorkspaceSnapshot` in the controller.
  - Preferred backend graph, proposal, simulation, governance, execution gate, workflow stages, audit events, scenario, validation, and provider metadata whenever the backend is connected.
  - Preserved deterministic local computation for browser fallback mirror mode.
  - Cleared stale backend snapshots when backend sync fails or browser fallback mode is entered.
  - Excluded `src/ai` from the browser app TypeScript project while keeping it in the server TypeScript project.
- Hackathon Reviewer Report:
  - Score before: 72/100.
  - Score after: 92/100 expected after patch and verification.
  - Blocking findings: none known.
  - Non-blocking findings: Chromium launch requires elevation in this environment; elevated PowerShell prints a non-project profile warning after successful browser runs.
  - Customer confidence notes: frontend now treats backend snapshots as authoritative in connected mode, keeps OpenAI backend-only, and continues to label enterprise execution as mock-only.
- Verification results:
  - `npm run typecheck` passed.
  - `npm test` passed, 64 tests.
  - `npm run test:backend` passed, 20 tests.
  - `npm run build` passed.
  - `npm run scan:frontend-secrets` passed.
  - `npm run verify:fullstack` passed with 0 vulnerabilities.
  - `npm run typecheck:e2e` passed.
  - `npm run test:e2e` initially failed with `browserType.launch: spawn EPERM` in the sandbox, then passed with elevated browser launch, 12 Chromium tests.
  - `npm run test:e2e:preview` passed with elevated browser launch, 12 Chromium tests.
  - `git diff --check` passed with Windows line-ending warnings only.
- Blockers: none for implementation; browser launch needs escalation in this sandbox.

### 2026-07-05: Live OpenAI POC Smoke

- Branch: `backend-branch`
- Agents used: main orchestrator only.
- Trigger: user requested a live OpenAI API POC test.
- Files changed:
  - `tasks.md`
  - `loop_task_phases.md`
- Implementation tasks completed:
  - Checked for `OPENAI_API_KEY` without printing it.
  - Loaded the key only into the backend smoke process from local `.env`.
  - Ran direct `WorkspaceService` proposal generation against a temp SQLite DB.
  - Ran local HTTP `/api` proposal generation against a temp SQLite DB.
- Security And Secret Boundary:
  - No key, bearer header, raw prompt, or raw provider error was printed.
  - No browser OpenAI request was made.
  - The API key remained server-process-only.
- Results:
  - Direct service smoke passed.
  - HTTP `/api` smoke passed.
  - Provider mode: `openai`.
  - Provider label: `OpenAI Responses API`.
  - Model: `gpt-5.5`.
  - Invocation status: `succeeded`.
  - Validation status: `validated`.
  - Fallback code: none.
  - Proposal ID: `proposal-pattern-standard_access-v1`.
  - Audit trail included `Live OpenAI proposal generated`.
- Blockers: none.
