# 8. Continuation Plan

## 8.1 Current Baseline

Work Graph Foundry already has a credible local-first foundation:

- React/Vite/TypeScript dashboard
- deterministic IT access request scenario
- typed fixtures and validation
- domain modules for ingestion, graphing, pattern detection, planning, simulation, governance, execution, and learning
- deterministic mock AI provider with an OpenAI Responses API boundary
- numbered documentation guides and archived implementation history
- unit, component, and Playwright e2e tests

The next build should preserve that foundation while making the demo more stable across graph inspection, QA, proposal iteration, and visual explanation.

## 8.2 Current Next Actions

Use this file as the active handoff for the next implementation pass. Keep changes scoped, deterministic, and compatible with concurrent edits.

1. Fix graph identifiers so nodes, edges, bottlenecks, exports, and future graph views use stable ids across reloads, resets, and scenario switches.
2. Expand QA around the existing Playwright e2e path, including mobile viewports, accessibility checks, rejection gates, import/export, and reset recovery.
3. Add proposal versioning so regenerated proposals can be compared, approved, rejected, exported, and audited without overwriting prior review context.
4. Add a richer graph visualization that makes process stages, bottlenecks, exceptions, provenance, and selected scenario context easier to inspect.
5. Keep all execution mock-only and governance-gated while these improvements land.

## 8.3 Work Notes

### 8.3.1 Graph Id Fix

Target outcome:

- each graph node and edge has a deterministic, scenario-scoped id
- persisted state and exported summaries can reference graph elements safely
- UI selections do not drift after reload, reset, import, or scenario switch
- tests cover id stability for both IT access and procurement scenarios

### 8.3.2 QA Expansion

Current browser command:

```powershell
npm run test:e2e
```

Install Chromium first if needed:

```powershell
npm run test:e2e:install
```

Use `npm run test:e2e:preview` for the preview-backed Playwright path and `npm run typecheck:e2e` when validating the e2e TypeScript project.

Add or extend checks for:

- mobile viewport layout without horizontal overflow
- accessible labels, focus order, keyboard navigation, and contrast
- approve and reject governance paths
- import/export recovery
- reset after generated state
- CI execution of unit, build, audit, and e2e checks

Sandboxed environments may require explicit permission to install Chromium or launch the browser.

### 8.3.3 Proposal Versioning

Target outcome:

- regenerated proposals create new versions instead of replacing the prior proposal silently
- approval and rejection records identify the exact proposal version
- exports include proposal version history
- the UI makes the current approved version clear before mock execution
- tests cover proposal regeneration, comparison, approval, rejection, and export

### 8.3.4 Graph Visualization

Target outcome:

- the dashboard shows a clearer visual graph without hiding the existing textual evidence
- selected graph elements reveal source traces, policy context, bottleneck metrics, and exceptions
- the visualization works for both implemented scenarios
- mobile layout remains usable
- the implementation keeps typed graph contracts in `src/domain/` as the source of truth

## 8.4 Verification Plan

Run before handoff:

```powershell
npm run verify:demo
npm run test:e2e
git status --short
```

Expected outcome:

- typecheck passes
- tests pass
- production build passes
- audit has no low-or-higher vulnerabilities
- Playwright Chromium e2e passes when browser launch is allowed
- only intentional source, docs, script, and test files are changed

If Playwright is blocked by sandbox permissions, request permission or document the blocker with the exact command that failed.

## 8.5 Guardrails

- Do not add real enterprise connectors.
- Do not require OpenAI credentials.
- Do not expose API keys in browser code.
- Do not mutate external systems.
- Do not remove the existing IT access request story.
- Do not replace typed domain behavior with UI-only mockups.
- Do not treat browser permission failures as product failures.
