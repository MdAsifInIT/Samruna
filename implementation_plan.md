# E2E Test Fix Plan — Post Hackathon Polish

## Diagnostic Summary

I have thoroughly tested the entire solution after Codex's implementation of the hackathon polish plan:

- **Frontend Unit Tests:** 64/64 passed (`npm run test`)
- **Backend Unit Tests:** 20/20 passed (`npm run test:backend`)
- **Type Checking:** Passed (`npm run typecheck` and `typecheck:server`)
- **E2E Integration Tests (Playwright):** **FAILED** (`npm run test:e2e`)

The E2E tests failed because they were heavily asserting on UI strings and DOM structures that Codex just modernized and removed as part of the polish plan (e.g., removing the developer-centric `topbar-meta` paragraph, updating button labels, and renaming technical jargon).

This plan outlines the required changes to `tests/e2e/golden-demo.e2e.ts` to make the integration tests pass.

## Proposed Changes

### [MODIFY] [tests/e2e/golden-demo.e2e.ts](file:///c:/Users/Primary/Documents/Work%20Graph%20Foundry/tests/e2e/golden-demo.e2e.ts)

1. **Remove `topbar-meta` assertions (Task 1.6: Topbar De-clutter)**
   Codex removed the dense `topbar-meta` block (`aria-label="Workflow context"`). We need to remove the assertions that check for its text.
   - **Delete** lines 108–110: 
     ```typescript
     await expect(page.getByLabel("Workflow context").first()).toContainText("Scenario: IT access requests");
     // ... Step: Overview ... Gate: Approval needed
     ```
   - **Modify** `expectScenarioContext` function (lines 371-373): Instead of checking `Workflow context`, check the value of the `Select workflow` dropdown in the sidebar/toolbar.

2. **Update Confidence Strip assertions (Task 1.6 & Task 2.5)**
   The confidence strip no longer has the "Mock simulation only" pill, and the "Deterministic mock" string was renamed to "Validation engine".
   - **Delete** line 114: `await expect(page.getByLabel("Backend and provider status")).toContainText("Mock simulation only");`
   - **Update** line 112: Change `"Deterministic mock"` to `"Validation engine"`.

3. **Update Review & Run View assertions (Task 2.5: Copy Audit)**
   The primary execution button and developer-centric disclaimers were updated to business-friendly language.
   - **Find and Replace** all instances (lines 152, 187, 217, 263, 318, 360, 362, 394):
     `page.getByRole("button", { name: "Run mock simulation" })` 
     **with** 
     `page.getByRole("button", { name: "Execute workflow" })`
   - **Update** line 391: Change `"Deterministic mock"` to `"Validation engine"`.
   - **Update** line 395: Change `"Mock simulation only. No enterprise connector, provisioning system, or customer workflow is modified."` 
     **to** `"Safe simulation mode. No external systems are modified."`

## Verification Plan

### Automated Tests
- Run `npm run test:e2e` to confirm all 12 E2E Playwright tests pass against the new UI.
- Run `npm run verify:fullstack` for a final clean run of the entire pipeline.
