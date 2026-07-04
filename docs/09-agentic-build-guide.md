# 9. Agentic Build Guide

## 9.1 Purpose

This guide is for a future agent or developer continuing Work Graph Foundry safely. The repository is a runnable local demo, not a blank prototype. Preserve the existing React/Vite/TypeScript app, typed domain modules, deterministic mock AI behavior, governance flow, simulation logic, local persistence, fixtures, tests, and numbered docs.

## 9.2 Required First Steps

Run:

```powershell
git status --short
rg --files
```

Read:

- `README.md`
- `docs/README.md`
- `docs/01-overview.md` through `docs/10-demo-operations.md`
- `package.json`
- `src/App.tsx`
- `src/domain/*`
- `src/ai/providers.ts`
- existing tests

Do not begin implementation before understanding the current scenario, persistence, governance, and mock execution contracts.

## 9.3 Verification Checklist

Use this checklist before and after meaningful changes:

1. Observe current repo state with `git status --short`.
2. Map workflows and data model from `src/domain/types.ts` and `src/fixtures/demoData.ts`.
3. Run `npm run typecheck`.
4. Run `npm run typecheck:e2e` when changing the Playwright config or the e2e TypeScript project.
5. Run `npm run verify:demo`.
6. Install Playwright Chromium with `npm run test:e2e:install` if the browser is not already installed.
7. Run `npm run test:e2e:preview` or `npm run test:e2e` when browser launch is allowed.
8. Start local demo with `npm run demo:dev`.
9. Walk the UI flow: landing page, `Launch demo`, scenario, load workflow, analyze workflow, generate automation proposal, approve, run simulation, export, reset.
10. Switch to procurement and verify load, analyze, proposal generation.
11. Verify reset/recovery restores seeded local state.
12. Verify mock AI fallback by leaving `OPENAI_API_KEY` unset.
13. Verify no secrets, exported local state files, or customer data are committed.

Sandboxed environments may require explicit permission to install Chromium or launch the browser. If permission is denied, record the exact blocker in the handoff.

Expected outcomes:

- typecheck passes
- verify:demo passes
- test suite passes
- build passes
- audit reports no low-or-higher vulnerabilities
- Playwright e2e passes when browser launch is allowed
- mock execution never mutates external systems

## 9.4 Extension Rules

- Prefer deterministic domain logic before UI changes.
- Keep all sample data synthetic.
- Add request types and scenario metadata in typed contracts.
- Extend fixture validation when adding new scenario data.
- Persist new demo state only through `src/domain/persistence.ts`.
- Keep live OpenAI calls server-side only if they are added.
- Keep execution mock-only unless a future production architecture adds authenticated, allowlisted tool execution with approvals.
- Keep Playwright e2e in the verification path when browser access is available, including the landing-first entry, five workspace views, responsive viewports, and performance smoke.

## 9.5 Common Failure Modes

- Scenario added without policy rules or approval history.
- Ingestion inference does not recognize new request types.
- Proposal generation works only for the default scenario.
- Governance records are skipped to make execution easier.
- Exported run summaries or real local data are committed.
- Browser code reads secrets.
