# 8. Continuation Plan

## 8.1 Current Baseline

Work Graph Foundry already has a credible local-first foundation:

- React/Vite/TypeScript dashboard
- deterministic IT access request scenario
- typed fixtures and validation
- domain modules for ingestion, graphing, pattern detection, planning, simulation, governance, execution, and learning
- deterministic mock AI provider with an OpenAI Responses API boundary
- numbered documentation guides and archived implementation history
- unit and component tests

The next build should preserve that foundation while making the demo feel more operational and repeatable.

## 8.2 Implementation Goals

Status: implemented in this continuation pass. Keep this file as the short record of what was planned and completed.

1. Add lightweight browser-local persistence for demo run state without introducing a backend.
2. Add deterministic seed/reset utilities so operators and agents can return to a known state.
3. Expand scenario management beyond IT access requests with typed synthetic enterprise data.
4. Make the dashboard guide operators through the full demo path without turning it into a marketing page.
5. Preserve governed, mock-only execution by default.
6. Make AI assumptions, proposal rationale, governance decisions, execution results, and audit events reviewable.
7. Extend docs and tests so the repository remains easy for future agents to continue.

## 8.3 Implemented Work

### Phase 1: Demo Persistence And Reset

- Added a dependency-light local storage module under `src/domain/`.
- Persisted selected scenario id, staged run state, generated graph, proposals, approval decisions, execution run, learning recommendation, and audit events.
- Added deterministic seed/reset helpers.
- Added npm scripts for local seed/reset guidance using dependency-free Node scripts.

### Phase 2: Scenario And Dataset Management

- Generalized fixture loading around scenario definitions.
- Kept IT access as the default scenario.
- Added a synthetic procurement intake scenario with request traces, approvals, policy rules, and a new incoming request.
- Added validation coverage for scenario ids and fixture integrity.
- Added import/export support for run summaries in the UI.

### Phase 3: Demo Operator Experience

- Added a scenario selector and a compact operator checklist.
- Made the flow explicit: load scenario, analyze workflow, inspect graph, generate proposal, review governance notes, approve or reject, run mock execution, view audit trail and recommendation.
- Kept the dashboard dense, readable, and operational.
- Used existing styling conventions and lucide-react icons.

### Phase 4: AI Provider And Governance Boundary

- Kept deterministic mock behavior as the browser default.
- Added reviewable agent context: inputs, assumptions, proposal rationale, risk notes, and simulated execution results.
- Documented server-side-only live OpenAI usage, environment variables, fallback behavior, and failure modes.

### Phase 5: Security, Testing, And Documentation

- Extended FAQ-style security docs with required data, explicitly unnecessary data, retention, auditability, and human approval.
- Added tests for scenario loading, persistence/reset, proposal generation, approval/rejection, and audit logging.
- Added `docs/09-agentic-build-guide.md` and `docs/10-demo-operations.md`.
- Updated README and numbered docs so they remain the canonical walkthrough.

## 8.4 Verification Plan

Run before handoff:

```powershell
npm run typecheck
npm test
npm run build
npm audit --audit-level=low
git status --short
```

Expected outcome:

- typecheck passes
- tests pass
- production build passes
- audit has no low-or-higher vulnerabilities
- only intentional source, docs, script, and test files are changed

## 8.5 Guardrails

- Do not add real enterprise connectors.
- Do not require OpenAI credentials.
- Do not expose API keys in browser code.
- Do not mutate external systems.
- Do not remove the existing IT access request story.
- Do not replace typed domain behavior with UI-only mockups.
