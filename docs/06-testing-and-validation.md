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
4. Run `npm run typecheck`.
5. Run `npm test`.
6. Run `npm run build`.
7. Run `npm audit --audit-level=low`.
8. Start preview with `npm run preview`.
9. Open the app.
10. Click `Load Scenario`.
11. Click `Analyze`.
12. Confirm normalized evidence, graph, and patterns render.
13. Click `Generate Proposal`.
14. Confirm proposal, simulation, governance, execution, and audit panels render.
15. Click `Approve`.
16. Confirm execution gate is open.
17. Click `Run Mock`.
18. Confirm mock tool calls and learning recommendation.
19. Click `Export Summary`.
20. Confirm JSON includes the selected scenario id.
21. Click `Reset`.
22. Confirm generated state clears.
23. Switch to `Procurement intake`.
24. Repeat load, analyze, generate proposal.
25. Check mobile width for horizontal overflow.

## 6.5 Full Verification Command Set

```powershell
npm run typecheck
npm test
npm run build
npm audit --audit-level=low
```

Expected current baseline:

- typecheck passes
- 10 test files pass
- 29 tests pass
- build passes
- audit reports 0 vulnerabilities

## 6.6 Test Map

| Behavior | Test File |
| --- | --- |
| Dashboard golden path | `src/App.test.tsx` |
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

## 6.7 Manual Browser Validation

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
15. Click `Reset`.
16. Confirm run output disappears.

## 6.8 Mobile Validation

At a mobile-width viewport:

- top controls should wrap cleanly
- script path should stack
- status cards should stack
- panels should not overflow horizontally
- text should not overlap
- golden path should remain usable
- text should not overlap inside compact controls

## 6.9 What To Test When Extending

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

## 6.10 Release Checklist

Before a release or push:

- docs updated
- README links current
- no secrets committed
- `.env.example` updated if env vars changed
- tests pass
- build passes
- audit clean
- manual golden path checked
- working tree clean
