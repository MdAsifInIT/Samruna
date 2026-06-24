# 6. Testing And Validation

## 6.1 Unit Tests

Run:

```powershell
npm test
```

Current unit coverage includes:

- fixture validation
- scenario loading
- local persistence and reset
- ingestion and normalization
- graph generation
- pattern detection
- planner output
- simulation and governance
- execution and learning
- AI provider parsing

## 6.2 Integration Tests

The current test suite includes integration-style checks across domain modules.

Important examples:

- building a proposal from fixtures, ingestion, graph, patterns, and policies
- simulating that proposal against historical work items
- verifying governance blocks execution until approval
- verifying execution emits mock tool calls after approval

Future integration tests should cover:

- imported datasets
- scenario import/export summaries
- server-side OpenAI provider route
- connector ingestion
- persisted proposal versions
- audit event retrieval

## 6.3 UI Smoke Tests

Current UI coverage lives in `src/App.test.tsx`.

It checks:

- dashboard first screen renders
- operational summary shows scenario, demo path, current stage, AI mode, governance state, and mock safety boundary
- scenario selector renders
- `Load Scenario` reveals source counts
- `Analyze` reveals normalized evidence
- graph and pattern selection details render
- proposal and governance panels appear
- approval opens the execution gate and enables `Run Mock`
- rejection keeps execution blocked
- `Run Mock` shows mock tool output
- audit trail and learning recommendation appear
- learning recommendation appears
- `Export Summary` produces run JSON
- `Reset` restores seeded state

## 6.4 Agentic Verification Steps

When an agent validates this repo, it should perform these steps:

1. Read `README.md`.
2. Read numbered docs in `docs/`.
3. Run `rg --files` to inspect the repo.
4. Run `npm run verify:demo`.
5. Run `npm run test:e2e` when Playwright browser binaries are installed.
6. If manual browser access is needed, start preview with `npm run preview`.
7. Open the app.
8. Click `Load Scenario`.
9. Click `Analyze`.
10. Confirm normalized evidence, selectable graph inspection, and pattern details render.
11. Click `Generate Proposal`.
12. Confirm proposal, simulation, governance, execution, and audit panels render.
13. Click `Approve`.
14. Confirm execution gate is open.
15. Click `Run Mock`.
16. Confirm mock tool calls and learning recommendation.
17. Click `Export Summary`.
18. Confirm JSON includes the selected scenario id.
19. Click `Reset`.
20. Confirm generated state clears.
21. Switch to `Procurement intake`.
22. Repeat load, analyze, generate proposal.
23. Check mobile width for horizontal overflow.

The Playwright e2e suite is the preferred browser verification path. It serves Vite locally, runs deterministic Chromium tests, and validates the two golden scenarios plus localStorage reload and reset recovery.

## 6.5 Playwright E2E Tests

Run:

```powershell
npm run test:e2e:install
npm run typecheck:e2e
npm run test:e2e
npm run test:e2e:preview
```

Expected behavior:

- Playwright starts the Vite app with a local web server.
- Tests run in local Chromium against deterministic demo data.
- Both golden scenarios complete load, analyze, proposal generation, governance approval, mock execution, export, and reset checks.
- Rejection, export/import round trip, malformed localStorage recovery, and mobile horizontal overflow are covered in Chromium.
- Preview-backed e2e validates the production build path.
- Successful runs leave no browser artifacts that need to be committed.
- Failed runs capture screenshots, videos, and traces for debugging.

Browser dependency notes:

- The command requires the Playwright Chromium browser binary to be installed on the machine.
- If the runner reports a missing browser executable, install the browser binaries after dependency installation with `npm run test:e2e:install`.
- CI and local agents should use the installed Playwright browser binaries rather than a system browser so results stay deterministic.

## 6.6 Full Verification Command Set

```powershell
npm run verify:demo
npm run typecheck:e2e
npm run test:e2e
npm run test:e2e:preview
```

Expected current baseline for `npm run verify:demo`:

- typecheck passes
- 10 test files pass
- 37 tests pass
- build passes
- audit reports 0 vulnerabilities

Expected current baseline for `npm run test:e2e`:

- local Vite server starts
- deterministic Chromium browser tests pass
- golden paths pass for `IT access requests` and `Procurement intake`
- rejection, export/import, localStorage recovery, mobile overflow, and preview-backed checks pass

## 6.7 Test Map

| Behavior | Test File |
| --- | --- |
| Dashboard golden path | `src/App.test.tsx` |
| Browser golden paths | Playwright e2e suite via `npm run test:e2e` |
| Browser localStorage recovery | Playwright e2e suite via `npm run test:e2e` |
| Provider behavior | `src/ai/providers.test.ts` |
| Fixture validation | `src/domain/fixtures.test.ts` |
| Scenario loading | `src/domain/fixtures.test.ts` |
| Persistence and reset | `src/domain/persistence.test.ts` |
| Ingestion | `src/domain/ingestion.test.ts` |
| Graph generation | `src/domain/graph.test.ts` |
| Pattern scoring | `src/domain/patterns.test.ts` |
| Proposal generation | `src/domain/planner.test.ts` |
| Simulation and governance | `src/domain/simulation.test.ts` |
| Execution and learning | `src/domain/execution.test.ts` |

## 6.8 Manual Browser Validation

Manual smoke path:

1. `npm run build`
2. `npm run preview`
3. Open preview URL.
4. Click `Load Scenario`.
5. Click `Analyze`.
6. Click `Generate Proposal`.
7. Confirm all major panels render.
8. Click `Approve`.
9. Confirm execution gate changes from `Blocked` to `Open`.
10. Click `Run Mock`.
11. Confirm `mock task IT-2001 created`.
12. Confirm learning recommendation mentions human-review lane.
13. Click `Export Summary`.
14. Confirm summary JSON appears.
15. Refresh the browser and confirm the selected scenario and generated state recover from localStorage.
16. Click `Reset`.
17. Confirm run output disappears.
18. Refresh again and confirm reset state persists.

If Playwright browser binaries are unavailable, treat `npm run verify:demo` plus this manual path as the local POC verification gate.

## 6.9 Mobile Validation

At a mobile-width viewport:

- top controls should wrap cleanly
- script path should stack
- status cards should stack
- panels should not overflow horizontally
- text should not overlap
- golden path should remain usable
- text should not overlap inside compact controls

## 6.10 What To Test When Extending

For a new workflow:

- fixture validity
- normalization fields
- graph nodes and edges
- pattern ranking
- bottleneck evidence
- proposal rules
- simulation classifications
- approval gate
- execution behavior
- learning recommendation
- persistence snapshot and reset behavior

For live OpenAI support:

- server route validation
- missing key behavior
- model failure fallback
- invalid structured output rejection
- successful structured output parsing

For enterprise connectors:

- connector auth failure
- empty sync
- partial sync
- malformed source records
- duplicate source records
- provenance preservation

## 6.11 Release Checklist

Before a release or push:

- docs updated
- README links current
- no secrets committed
- `.env.example` updated if env vars changed
- tests pass
- Playwright e2e passes or missing browser binaries are documented
- build passes
- audit clean
- manual golden path checked
- working tree clean
