# 8. Continuation Plan

## 8.1 Current Baseline

Work Graph Foundry already has a credible local-first foundation:

- React/Vite/TypeScript landing page and hash-backed demo workspace
- deterministic IT access request scenario
- typed fixtures and validation
- domain modules for ingestion, graphing, pattern detection, planning, simulation, governance, execution, and learning
- Historical validation engine provider with an OpenAI Responses API boundary
- numbered documentation guides and archived implementation history
- unit, component, and Playwright e2e tests
- completed backend/API-backed workspace flow
- completed proposal versioning and comparison
- completed UI polish pass for the current reviewer-first shell

The next build should preserve that foundation while keeping the landing-first entry, five-view workspace, graph inspection, QA, reviewer-first execution gating, and visual explanation stable.

## 8.2 Current Next Actions

Use this file as the active handoff for the next implementation pass. Keep changes scoped, deterministic, and compatible with concurrent edits.

1. Expand QA around the existing Playwright e2e path, including landing entry, the five-view workspace, mobile viewports, accessibility checks, rejection gates, import/export, and reset recovery.
2. Keep all execution in safe simulation mode and governance-gated while the remaining polish and QA improvements land.

## 8.3 Work Notes

### 8.3.1 Graph Id Fix

Completed baseline:

- each graph, node, and edge id is deterministic and scenario-scoped
- node ids include scenario id, pattern id, typed node kind, and stable role
- edge ids include scenario id, pattern id, stable source role, relation, and target role
- tests cover repeated graph builds, IT/procurement id separation, expected important ids, and unchanged graph counts and metrics

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

### 8.3.3 Historical Completed Work

Completed in prior passes:

- backend/API-backed workspace flow
- proposal versioning and comparison
- reviewer-first UI polish for the current shell
- deterministic graph identifiers and scenario-scoped graph builds

Keep this section as a historical reference only. Do not reopen these items unless a regression appears.

## 8.4 Verification Plan

Run before handoff:

```powershell
npm run verify:demo
npm run typecheck:e2e
npm run test:e2e
npm run test:e2e:preview
git status --short
```

Expected outcome:

- typecheck passes
- tests pass
- production build passes
- audit has no low-or-higher vulnerabilities
- Playwright Chromium e2e passes when browser launch is allowed, including desktop, tablet, mobile, small-mobile, and performance-smoke coverage
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
