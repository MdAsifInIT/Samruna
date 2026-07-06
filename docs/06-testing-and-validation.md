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
- verifying execution emits safe simulated tool calls after approval

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

- customer-facing landing page renders first
- landing page exposes exactly one visible `Launch` button
- landing workflow blocks, connected automation path, and proof band render
- sidebar navigation exposes Overview, Evidence, Graph, Review & Run, and Audit with active state
- operational summary shows scenario, demo path, current stage, provider state, governance state, and safe execution boundary
- topbar status stays compact, while the progress stepper keeps the staged path visible
- scenario selector renders
- `Launch` opens the workspace and `Load Workflow` opens Evidence with source counts
- `Analyze` opens Graph and reveals graph and pattern discovery
- Evidence still shows normalized evidence after analysis
- graph and pattern selection details render from the Graph menu view
- proposal, governance, execution, and audit panels render from their dedicated menu views
- approval and rejection actions live in `Review & Run`
- export/import and reset actions live in `Audit`
- approval opens the execution gate and enables `Execute workflow`
- rejection keeps execution blocked
- `Execute workflow` keeps the user in Review & Run, shows safe simulated actions, marks the execution gate `Completed`, and displays the success banner
- Audit shows audit trail and export/import controls
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
8. Click `Launch`.
9. Click `Load Workflow` and confirm Evidence shows source counts and channel data.
10. Click `Analyze`.
11. Confirm Graph shows selectable graph inspection and pattern details.
12. Open Evidence and confirm normalized evidence renders.
13. Click `Generate Proposal`.
14. Confirm Review & Run shows proposal details and versions.
15. Open Review & Run and confirm simulation, policy context, and approval controls render.
16. Click `Approve`.
17. Confirm execution gate is open.
18. Click `Execute workflow`.
19. Confirm Review & Run shows safe simulated actions, the success banner, `Completed` execution gate state, and learning recommendation.
20. Open Audit.
21. Click `Export Summary`.
22. Confirm JSON includes the selected scenario id.
23. Click `Reset`.
24. Confirm generated state clears from Graph, Review & Run, and Audit.
25. Switch to `Procurement intake`.
26. Repeat load, analyze, generate proposal.
27. Check mobile width for horizontal overflow and mobile view selection.

The Playwright e2e suite is the preferred browser verification path. It serves Vite locally, runs deterministic Chromium tests, and validates the two golden scenarios plus backend workspace persistence, browser mirror recovery, reload, and reset recovery.

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
- Both golden scenarios complete load, analyze, proposal generation, governance approval, safe execution, export, and reset checks.
- Menu navigation is exercised for generated analysis, governance, execution, review, import, reload recovery, reset recovery, and mobile overflow.
- Rejection, export/import round trip, backend workspace readback, malformed persistence recovery, and mobile horizontal overflow are covered in Chromium.
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
- Vitest app/domain/backend suites pass
- build passes
- audit reports 0 vulnerabilities

Expected current baseline for `npm run test:e2e`:

- local Vite server starts
- deterministic Chromium browser tests pass
- golden paths pass for `IT access requests` and `Procurement intake`
- landing screen checks the three workflow blocks, connected automation path, impact proof band, and single visible `Launch` CTA
- rejection, export/import, backend persistence readback, mirror recovery, mobile overflow, and preview-backed checks pass

## 6.7 Test Map

| Behavior | Test File |
| --- | --- |
| Dashboard golden path | `src/App.test.tsx` |
| Browser golden paths | Playwright e2e suite via `npm run test:e2e` |
| Browser workspace/API recovery | Playwright e2e suite via `npm run test:e2e` |
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
4. Click `Launch`.
5. Click `Load Workflow` and confirm Evidence shows loaded counts and source channels.
6. Click `Analyze`.
7. Confirm Graph shows the work graph and detected patterns.
8. Click `Generate Proposal`.
9. Confirm Review & Run shows the governed proposal.
10. Open Review & Run and confirm simulation plus governance controls render.
11. Click `Approve`.
12. Confirm execution gate changes from `Blocked` to `Available`.
13. Click `Execute workflow`.
14. Confirm Review & Run shows executed actions, a success banner, and `Completed` execution gate state.
15. Confirm learning recommendation mentions human-review lane.
16. Open Audit and click `Export Summary`.
17. Confirm summary JSON appears.
18. Refresh the browser and confirm the selected scenario and generated state recover from the backend workspace state and browser mirror by opening Graph and Review & Run.
19. Click `Reset`.
20. Confirm generated output disappears from Graph, Review & Run, and Audit.
21. Refresh again and confirm reset state persists.

If Playwright browser binaries are unavailable, treat `npm run verify:demo` plus this manual path as the local POC verification gate.

## 6.9 Mobile Validation

At a mobile-width viewport:

- top controls should wrap cleanly
- mobile view selector should switch between Overview, Evidence, Graph, Review & Run, and Audit
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
