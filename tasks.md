# Frontend UI Overhaul Task Log

## Decisions

- Made the app landing-first with a `Launch demo` CTA and a hash-backed `#demo` workspace.
- Kept `useWorkGraphDemoController` and the persisted demo state shape unchanged.
- Reduced workspace navigation to `Overview`, `Evidence`, `Graph`, `Review & Run`, and `Audit`.
- Replaced stacked `Plan`, `Govern`, and `Execute` rendering with one reviewer-oriented `Review & Run` surface.
- Removed decorative radial/orb page backgrounds and avoided adding animation libraries.
- Used a code-native product preview on the landing page because no bitmap image generation tool was available in this execution environment.
- Deleted `src/components/shared/MetricCard.tsx` because no active imports remained.
- Preserved export/import, reset, malformed localStorage recovery, proposal versions, approval/rejection, gated simulation, and mock execution behavior.

## Files Changed

- `src/App.tsx`
- `src/app/navigation.ts`
- `src/app/AppShell.tsx`
- `src/features/overview/OverviewView.tsx`
- `src/features/plan/PlanView.tsx`
- `src/features/govern/GovernView.tsx`
- `src/features/execute/ExecuteView.tsx`
- `src/features/review-run/ReviewRunView.tsx`
- `src/styles.css`
- `src/components/shared/MetricCard.tsx`
- `src/App.test.tsx`
- `tests/e2e/golden-demo.e2e.ts`
- `README.md`
- `docs/01-overview.md`
- `docs/02-architecture.md`
- `docs/04-demo-setup.md`
- `docs/06-testing-and-validation.md`
- `docs/08-continuation-plan.md`
- `docs/09-agentic-build-guide.md`
- `docs/10-demo-operations.md`
- `docs/11-hackathon-demo.md`
- `tasks.md`

## Component Rationalization

- Kept: domain controller, shell workflow controls, status pills, evidence view, graph view, audit/export/import view.
- Merged: proposal, simulation, governance, execution, and learning loop into `Review & Run`.
- Removed from active UI and source: old dashboard metric grid, overview checklist, repeated Plan/Govern/Execute view headings, unused Plan/Govern/Execute view files, and unused `MetricCard`.

## Verification Log

- `npm run typecheck` passed.
- `npm test` initially failed after the route change because tests still assumed workspace-first state; updated tests to launch the demo and load workflow explicitly.
- `npm test` passed after fixes: 10 test files, 41 tests.
- `npm run verify:demo` passed typecheck, Vitest, and production build. The bundled `npm audit --audit-level=low` step failed in the sandbox because the registry audit endpoint returned an error.
- `npm audit --audit-level=low` passed outside the sandbox with 0 vulnerabilities.
- `npm run typecheck:e2e` passed.
- `npm run test:e2e` passed: 12 Chromium tests.
- `npm run test:e2e:preview` passed: 12 Chromium tests.
- After deleting the unused Plan/Govern/Execute view files and unused `.dashboard-grid` CSS, `npm run typecheck`, `npm test`, `npm run typecheck:e2e`, `npm run build`, `npm run test:e2e`, and `npm run test:e2e:preview` all passed again.
- Browser plugin was attempted first for live QA, but the active tab was blocked by the Browser Use URL policy after entering an internal browser error state. Playwright was used as the safer fallback with the repository's configured local app servers.
- Viewport QA passed at 1440px desktop, 768px tablet, 390px mobile, and 375px small mobile. Each viewport checks the landing page, launches the workspace, runs the demo path, and asserts no horizontal overflow.
- Performance smoke passed in dev and preview runs. The test monitors browser Long Task entries during Launch demo, view switching, graph review, proposal generation, approval, and run interactions, and found no tasks at or above the 200ms budget.
- Console/page error monitoring passed across the Playwright e2e suite.
- Production build output succeeded with no added animation library.

## Remaining Risks

- Unsandboxed Playwright and audit commands print a non-project PowerShell profile warning from `Microsoft.PowerShell_profile.ps1`; the tested commands still exit successfully.
- Browser-plugin visual inspection could not be completed after the policy block, so the final responsive and performance checks are covered by Playwright automation rather than manual Browser screenshots.
