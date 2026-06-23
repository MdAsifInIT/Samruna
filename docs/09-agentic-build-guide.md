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
4. Run `npm test`.
5. Run `npm run build`.
6. Run `npm audit --audit-level=low`.
7. Start local demo with `npm run demo:dev`.
8. Walk the UI flow: scenario, load, analyze, generate proposal, approve, run mock, export, reset.
9. Switch to procurement and verify load, analyze, proposal generation.
10. Verify reset/recovery restores seeded local state.
11. Verify mock AI fallback by leaving `OPENAI_API_KEY` unset.
12. Verify no secrets, exported local state files, or customer data are committed.

Expected outcomes:

- typecheck passes
- test suite passes
- build passes
- audit reports no low-or-higher vulnerabilities
- mock execution never mutates external systems

## 9.4 Extension Rules

- Prefer deterministic domain logic before UI changes.
- Keep all sample data synthetic.
- Add request types and scenario metadata in typed contracts.
- Extend fixture validation when adding new scenario data.
- Persist new demo state only through `src/domain/persistence.ts`.
- Keep live OpenAI calls server-side only if they are added.
- Keep execution mock-only unless a future production architecture adds authenticated, allowlisted tool execution with approvals.

## 9.5 Common Failure Modes

- Scenario added without policy rules or approval history.
- Ingestion inference does not recognize new request types.
- Proposal generation works only for the default scenario.
- Governance records are skipped to make execution easier.
- Exported run summaries or real local data are committed.
- Browser code reads secrets.
