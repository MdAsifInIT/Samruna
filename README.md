# Samruna

**A submission for the HCLTech-OpenAI Agentic AI Hackathon**

Samruna is a governed workflow intelligence prototype for enterprise operations. It demonstrates how Agentic AI can transform messy, unstructured work traces into a visible process, generate structured automation proposals, and gate execution through human approval and safe simulation. 

For an enterprise (matching HCLTech's core focus), automation must be fast, explainable, and governed *before* any real side effects occur. Samruna proves that Agentic AI can plan and propose automations without blindly mutating production systems.

---

## 🚀 Live Demo (Reviewer Quickstart)

The fastest way to evaluate Samruna is via our live deployment. The frontend and backend are pre-configured to communicate with each other.

- **Frontend (GitHub Pages):** [https://mdasifinit.github.io/Samruna/](https://mdasifinit.github.io/Samruna/)
- **Backend (Render):** [https://samruna-api.onrender.com](https://samruna-api.onrender.com)

> [!TIP]
> **Hackathon Judges:** Click the Frontend link above, click `Launch`, select the default `IT access requests` scenario, and click `Load workflow` to begin exploring the Agentic AI capabilities.

---

## 🧠 How It Uses Agentic AI

This prototype moves beyond traditional RPA (Robotic Process Automation). Instead of hard-coding bot steps, Samruna leverages the **OpenAI API** to act as a reasoning engine:

1. **Observe & Understand:** It ingests noisy operational traces (tickets, emails, approval logs) and detects repeated work patterns to build a graph.
2. **Agentic Proposal:** The OpenAI engine reasons over the graph to generate a structured automation proposal—identifying required data, policy rules, and escalation paths.
3. **Governance Gate:** Control is never handed fully to the model. The AI plans the automation, but a human must review the policy checks and approve it.
4. **Safe Simulation:** Execution runs only in a synthetic simulation mode to preserve an audit trail without risking enterprise systems.

## What It Proves

- You can discover real workflow structure from noisy operational traces using AI.
- You can surface bottlenecks, exceptions, and approval paths clearly enough for review.
- You can generate a structured automation proposal *without* handing uncontrolled execution to the model.
- You can keep execution in safe simulation mode until a human approves it.
- You can preserve an audit trail and reset to seeded state at any time.

## Scenario Set

Samruna includes four synthetic enterprise workflows:

- `it-access`: employee access requests, approvals, and safe simulated provisioning.
- `procurement-intake`: purchase intake, routing, policy review, and approval flow.
- `vendor-onboarding`: supplier setup, compliance checks, and cross-functional review.
- `invoice-exceptions`: invoice discrepancy handling, escalation, and finance review.

## OpenAI Mode (Backend)

When `OPENAI_API_KEY` is set for the backend process, Samruna uses the OpenAI Responses API to generate proposal content and synthetic execution runs from already-analyzed workflow context. When the key is absent, or if the live call fails, the backend falls back to a deterministic historical validation engine.

Use backend-only environment variables. **Do not expose API keys to the browser or frontend code.**

## Safety Model

Samruna is safe by design for enterprise demonstration:

- all data is synthetic
- execution is simulated only
- approval is required before execution
- browser code never receives OpenAI API keys
- backend provider errors are sanitized before reaching the UI
- export/import operates on local prototype state
- reset restores the seeded workspace

No real enterprise systems are mutated by this prototype.

## Key Screens

- `Launch`: enters the workspace from the landing page.
- `Evidence`: shows source traces and normalized work items.
- `Graph`: shows the repeated workflow and bottleneck structure.
- `Review & Run`: shows the Agentic AI proposal, governance checks, and approval gate.
- `Audit`: shows events, exports, imports, and reset controls.

---

## Alternative: Local Evaluation

If you prefer to run the application locally instead of using the Live Demo, ensure you have Node.js 24 or newer.

```powershell
npm install
npm run backend:seed
npm run dev:fullstack
```

Open the local URL printed by Vite.

If you want to test the **Live OpenAI Mode** locally:

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_MODEL="gpt-4o"
npm run backend:seed
npm run dev:fullstack
```

## Useful Commands

```powershell
npm run demo:dev          # Start the local frontend demo
npm run dev:fullstack     # Start backend and frontend together
npm run backend:seed      # Reset local backend state
npm run build             # Typecheck and build production assets
npm test                  # Run unit tests
npm run test:e2e          # Run Playwright browser tests
npm run verify:demo       # Typecheck, test, build, and audit the demo
npm run verify:fullstack  # Full verification path for frontend and backend
```

## Documentation

- [FAQ](FAQ.md): Hackathon details, safety, OpenAI mode, and local run questions.
- [Documentation Index](docs/README.md): full project documentation.
- [Hackathon Demo](docs/11-hackathon-demo.md): Pitch framing and talk track.
- [Overview](docs/01-overview.md): purpose, current state, and main flows.
- [Demo Setup](docs/04-demo-setup.md): local run steps and operator guidance.
- [Data Access And Security](docs/05-data-access-and-security.md): data needs and safety model.
- [Testing And Validation](docs/06-testing-and-validation.md): verification coverage.
- [Demo Operations](docs/10-demo-operations.md): canonical operator runbook.
- [Full-Stack Demo Plan](docs/12-fullstack-demo-plan.md): backend/API reference.

## Current Scope

Samruna proves the workflow:
- observe work
- understand the pattern
- propose automation (Agentic AI)
- govern the proposal (Human-in-the-loop)
- simulate execution
- audit the result

It does not yet include production authentication, live enterprise connectors, real provisioning actions, customer data ingestion, production infrastructure, or final compliance controls.
