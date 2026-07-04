# Frontend UI Overhaul Task Log

## Decisions

- Made the app landing-first with a `Launch` CTA and a hash-backed `#demo` workspace.
- Positioned the landing page as reviewer-first and hackathon-friendly: clear claim, compact preview, and direct entry into the governed workspace.
- Kept the public landing claim explicit: Work Graph Foundry finds repeated patterns in an organization and turns them into governed automation.
- Kept `useWorkGraphDemoController` and the persisted demo state shape unchanged.
- Reduced workspace navigation to `Overview`, `Evidence`, `Graph`, `Review & Run`, and `Audit`.
- Replaced stacked `Plan`, `Govern`, and `Execute` rendering with one reviewer-oriented `Review & Run` surface.
- Removed decorative radial/orb page backgrounds and avoided adding animation libraries.
- Used a code-native product preview on the landing page because no bitmap image generation tool was available in this execution environment.
- Preserved export/import, reset, malformed localStorage recovery, proposal versions, approval/rejection, gated simulation, and mock execution behavior.

## Files Changed

- `src/App.tsx`
- `src/app/navigation.ts`
- `src/app/AppShell.tsx`
- `src/features/overview/OverviewView.tsx`
- `src/features/observe/ObserveView.tsx`
- `src/features/analyze/AnalyzeView.tsx`
- `src/features/review-run/ReviewRunView.tsx`
- `src/features/review/ReviewView.tsx`
- `src/styles.css`
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

## Refinement Pass

- Worker ownership: one `worker_nano` handled the app UI refinement slice; a second `worker_nano` handled tests, docs, and task-log updates.
- Audit decision: app source edits were intentionally scoped to landing copy, reviewer strip simplification, view heading clarity, and supporting CSS.
- Test update scope: loosened the reviewer status-strip checks so they rely on stable scenario, current stage, and execution gate text instead of the old noisy multi-pill set.
- Demo behavior preserved: `#demo`, scenario selection, load/analyze/proposal/review/run/export/reset, rejection gating, import/export, and golden-path recovery remain unchanged.
- Browser/performance expectation: keep the existing Playwright golden path and long-task budget behavior intact; the refinement pass should not introduce layout or execution regressions.
- Remaining risks: some assertions now depend on shell-context copy (`Scenario:`, `Current step:`, `Execution gate:`) and may need adjustment if that non-functional text changes again.

## Audit Decisions

- Kept archived docs untouched because no live doc pointed at stale archived instructions.
- Updated only live docs that directly describe the landing CTA, reviewer-first positioning, or demo walkthrough language.
- Left domain logic, fixtures, persistence, and controller contracts unchanged.

## Component Rationalization

- Kept: domain controller, shell workflow controls, status pills, evidence view, graph view, audit/export/import view.
- Merged: proposal, simulation, governance, execution, and learning loop into `Review & Run`.
- Removed from active UI and source: old dashboard metric grid, overview checklist, repeated Plan/Govern/Execute view headings, unused Plan/Govern/Execute view files, and unused `MetricCard`.

## Verification Log

- Commands run so far:
  - CTA copy scan over README, numbered docs, tests, source, and `tasks.md`
  - `Get-Content src/App.test.tsx`
  - `Get-Content tests/e2e/golden-demo.e2e.ts`
  - `Get-Content src/features/review-run/ReviewRunView.tsx`
  - `Get-Content README.md`
  - `Get-Content docs/01-overview.md`
  - `Get-Content docs/02-architecture.md`
  - `Get-Content docs/04-demo-setup.md`
  - `Get-Content docs/06-testing-and-validation.md`
  - `Get-Content docs/08-continuation-plan.md`
  - `Get-Content docs/09-agentic-build-guide.md`
  - `Get-Content docs/10-demo-operations.md`
  - `Get-Content docs/11-hackathon-demo.md`
- `npm run typecheck` passed after the UI refinement and integration cleanup.
- `npm test` passed after the e2e selector cleanup: 10 test files, 41 tests.
- `npm run build` passed after the UI refinement.
- `npm run verify:demo` passed after the final integration cleanup: typecheck, Vitest, production build, and `npm audit --audit-level=low` all passed with 0 vulnerabilities.
- `npm run typecheck:e2e` passed after the e2e selector cleanup.
- `npm run test:e2e` initially failed in the sandbox because Chromium launch was blocked with `spawn EPERM`; rerunning outside the sandbox launched Chromium successfully.
- `npm run test:e2e` then failed because stale selectors expected exact scenario text while the refined shell rendered `Scenario: ...`; updated the e2e helper to assert the reviewer status text.
- `npm run test:e2e` passed after the selector fix: 12 Chromium tests.
- `npm run test:e2e:preview` initially hit the same sandbox launch blocker and stale selector issue; after the selector fix and elevated browser launch it passed: 12 Chromium tests.
- `npm run test:e2e:install` was not run because Chromium was already installed.
- `rg "framer-motion|gsap|animejs" package.json package-lock.json src` returned no matches, confirming no animation library was added.
- Browser/IAB path was attempted after reading the Browser skill, but the temporary local server setup was blocked by local process/log permissions; Playwright dev and preview suites are the completed browser validation path for this pass.
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
- Performance smoke passed in dev and preview runs. The test monitors browser Long Task entries during `Launch`, view switching, graph review, proposal generation, approval, and run interactions, and found no tasks at or above the 200ms budget.
- Console/page error monitoring passed across the Playwright e2e suite.
- Production build output succeeded with no added animation library.

## Remaining Risks

- Unsandboxed Playwright and audit commands print a non-project PowerShell profile warning from `Microsoft.PowerShell_profile.ps1`; the tested commands still exit successfully.
- Browser-plugin visual inspection could not be completed after the policy block, so the final responsive and performance checks are covered by Playwright automation rather than manual Browser screenshots.
