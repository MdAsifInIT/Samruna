# Samruna

Samruna is a governed workflow intelligence POC - Proof Of Concept for enterprise operations.

It shows, in under 90 seconds, how messy work traces become a visible process, how that process becomes an AI-generated automation proposal, and how the proposal is still gated by human approval plus safe simulation. The point is simple: prove that automation can be fast, explainable, and governed before any real enterprise side effect exists.

This repository ships a local, synthetic, hackathon-friendly experience. It is intentionally safe by default, uses seeded scenarios, and can run with deterministic historical validation or with backend-only OpenAI Responses API proposal and execution generation when `OPENAI_API_KEY` is configured.

## What It Proves

- You can discover real workflow structure from noisy operational traces.
- You can surface bottlenecks, exceptions, and approval paths clearly enough for review.
- You can generate a structured automation proposal without handing control to the model.
- You can keep execution in safe simulation mode until a human approves it.
- You can preserve an audit trail and reset to seeded state at any time.

## Reviewer Quickstart

Requirement: Node.js 24 or newer.

Full-stack path first:

```powershell
npm install
npm run backend:seed
npm run dev:fullstack
```

Open the local URL printed by Vite.

If Vite dependency optimization is blocked in your environment, use:

```powershell
npm run build
npm run preview:fullstack -- --port 4174
```

## Scenario Set

Samruna includes four synthetic workflows:

- `it-access`: employee access requests, approvals, and safe simulated provisioning.
- `procurement-intake`: purchase intake, routing, policy review, and approval flow.
- `vendor-onboarding`: supplier setup, compliance checks, and cross-functional review.
- `invoice-exceptions`: invoice discrepancy handling, escalation, and finance review.

Each scenario follows the same governed loop:

1. Load workflow traces.
2. Normalize the source evidence.
3. Detect repeated work patterns.
4. Build the work graph.
5. Surface bottlenecks and exceptions.
6. Generate a governed automation proposal.
7. Review policy checks, required data, forbidden data, assumptions, and escalations.
8. Approve or reject the proposal.
9. Execute only in safe simulation mode.
10. Review the audit trail, export the run, import a prior run, or reset the workspace.

## OpenAI Mode

OpenAI is optional and backend-only.

When `OPENAI_API_KEY` is set for the backend process, Samruna uses the OpenAI Responses API to generate proposal content and synthetic execution runs from already-analyzed workflow context. When the key is absent, or if the live call fails, the backend falls back to the deterministic historical validation engine.

Use backend-only environment variables. Do not expose API keys to the browser or frontend code.

Example local backend setup:

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_MODEL="gpt-5.5"
npm run backend:seed
npm run dev:fullstack
```

## Safety Model

Samruna is safe by design:

- all data is synthetic
- execution is simulated only
- approval is required before execution
- browser code never receives OpenAI API keys
- backend provider errors are sanitized before reaching the UI
- export/import operates on local POC - Proof Of Concept state
- reset restores the seeded workspace

No real enterprise systems are mutated by this POC - Proof Of Concept.

## Key Screens

- `Launch`: enters the workspace from the landing page.
- `Evidence`: shows source traces and normalized work items.
- `Graph`: shows the repeated workflow and bottleneck structure.
- `Review & Run`: shows the proposal, governance checks, and approval gate.
- `Audit`: shows events, exports, imports, and reset controls.

## Useful Commands

```powershell
npm run demo:dev          # Start the local frontend POC - Proof Of Concept
npm run dev:fullstack     # Start backend and frontend together
npm run backend:seed      # Reset local backend POC - Proof Of Concept state
npm run build             # Typecheck and build production assets
npm test                  # Run unit tests
npm run test:e2e          # Run Playwright browser tests
npm run verify:demo       # Typecheck, test, build, and audit POC - Proof Of Concept
npm run verify:fullstack  # Full verification path for frontend and backend
```

## Documentation

- [FAQ](FAQ.md): product, safety, OpenAI mode, and local run questions.
- [Documentation Index](docs/README.md): full project documentation.
- [Overview](docs/01-overview.md): purpose, current state, and main flows.
- [POC - Proof Of Concept Setup](docs/04-demo-setup.md): local run steps and operator guidance.
- [Data Access And Security](docs/05-data-access-and-security.md): data needs and safety model.
- [Testing And Validation](docs/06-testing-and-validation.md): verification coverage.
- [POC - Proof Of Concept Operations](docs/10-demo-operations.md): canonical operator runbook.
- [Hackathon POC - Proof Of Concept](docs/11-hackathon-demo.md): pitch framing and talk track.
- [Full-Stack POC - Proof Of Concept Plan](docs/12-fullstack-demo-plan.md): backend/API reference.

## Verification

```powershell
npm run typecheck
npm test
npm run typecheck:server
```

Use `npm run typecheck` as the primary TypeScript check after a clean install. If you only need the lightest server-side pass, `npm run typecheck:server` is still available.

## Current Scope

Samruna proves the workflow:

- observe work
- understand the pattern
- propose automation
- govern the proposal
- simulate execution
- audit the result

It does not yet include production authentication, live enterprise connectors, real provisioning actions, customer data ingestion, production infrastructure, or final compliance controls.
