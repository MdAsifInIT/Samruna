# Samruna FAQ

## Where is it deployed and how can I test it?

Samruna is deployed live and configured for immediate review.

- **Frontend (GitHub Pages):** [https://mdasifinit.github.io/Samruna/](https://mdasifinit.github.io/Samruna/)
- **Backend (Render):** [https://samruna-api.onrender.com](https://samruna-api.onrender.com)

If you wish to evaluate the code locally instead:

```powershell
npm install
npm run backend:seed
npm run dev:fullstack
```

## Why is this a strong hackathon POC for the HCLTech-OpenAI Agentic AI Hackathon?

Samruna directly addresses the enterprise themes of the HCLTech-OpenAI Agentic AI Hackathon by combining a clear enterprise problem (messy workflows) with a governed Agentic AI solution:

- **Agentic Proposal Generation:** The OpenAI API acts as a reasoning engine, planning automations rather than just acting as a conversational chatbot.
- **Enterprise Governance (HCLTech focus):** HCLTech's enterprise clients require safety. Samruna proves that AI can plan automations while keeping a human in the loop for approval and running in safe simulation mode.
- **Visible Reasoning:** Work traces are turned into visual graphs before the AI proposes an automation, proving explainability.
- **Reliable Fallbacks:** The system defaults to a deterministic historical engine if the live AI generation fails, ensuring a stable presentation.

## How does Samruna leverage Agentic AI?

Traditional RPA requires developers to explicitly script every bot action. Samruna shifts this to an Agentic paradigm. The OpenAI API is given the context of an analyzed workflow graph and asked to act as an automation planner. It generates a structured proposal—identifying triggers, policy constraints, necessary data, and escalation paths—autonomously, which a human then reviews.

## What OpenAI capabilities are used?

When configured with an `OPENAI_API_KEY` on the backend, Samruna uses the **OpenAI Responses API** to generate:
1. **Automation Proposals:** Structured logic defining how a workflow should be automated based on graph evidence.
2. **Synthetic Execution Runs:** Simulated outcomes of the proposed automation for safe auditing.

## What is Samruna?

Samruna is a governed automation POC for enterprise workflows. It takes messy operational traces, turns them into a work graph, finds repeated patterns and bottlenecks, generates an automation proposal, and lets a human approve or reject the proposal before anything runs.

## Who is it for?

Samruna is built for teams that care about operational efficiency and governance:
- operations leaders
- IT and procurement teams
- automation teams
- compliance reviewers
- process owners
- hackathon judges evaluating agentic enterprise solutions

## What problem does it solve?

Many enterprise processes are hidden across tickets, email, chat, approvals, and system logs. Teams know work is repetitive, but they cannot always prove where the bottleneck is or safely automate the next step.

Samruna shows a path from scattered work traces to governed automation:
1. collect the evidence
2. identify the repeated workflow
3. explain the bottleneck
4. propose a safe automation via Agentic AI
5. require approval
6. simulate execution
7. preserve an audit trail

## What can I do in the POC?

You can run four synthetic workflow scenarios:
- **it-access**
- **procurement-intake**
- **vendor-onboarding**
- **invoice-exceptions**

For each scenario, you can load workflow evidence, analyze the graph, review an AI-generated automation proposal, approve or reject it, simulate execution, export the run, import a saved run, and reset the workspace.

## Is this using real customer data?

No. The POC uses synthetic organization data only. The scenarios are designed to feel realistic, but they do not contain real employee, customer, financial, HR, or production system records.

## What does the backend do?

The backend provides the engine behind the full-stack POC. It handles API routes for workspace actions, local SQLite persistence, scenario loading, workflow analysis state, and optional server-side OpenAI generation. It also keeps sensitive provider logic away from the browser.

## What does the frontend do?

The frontend is the product experience. It shows the landing page, dashboard workspace, workflow evidence, work graph, proposal review flow, approval actions, simulated execution, and audit tools. The browser never receives OpenAI API keys.

## What is safe simulation mode?

Safe simulation mode means execution is demonstrated without touching real enterprise systems. When you approve and run a proposal, Samruna creates a simulated result and audit trail. It does not create real tickets, provision real accounts, send real messages, or modify production systems.

## Why is approval required?

Automation can affect access, policy, cost, compliance, and operational risk. Samruna keeps the human reviewer in control. A proposal must be reviewed and approved before the simulated execution step becomes available.

## What is the Evidence view?

The **Evidence** view shows the source traces and normalized work items behind the analysis. Use it to understand what data supports the graph and proposal before approving anything.

## What is the Graph view?

The **Graph** view shows the repeated workflow as connected actors, approvals, systems, actions, exceptions, and outcomes. It helps explain where work slows down and why the proposed automation is relevant.

## What is Review & Run?

**Review & Run** is the governance checkpoint. It shows the generated proposal, simulation results, assumptions, policy checks, escalation rules, and approval controls. This is where a reviewer decides whether the AI proposal is safe to approve.

## What is the Audit view?

The **Audit** view shows the recorded events for the POC run. It also includes export, import, and reset controls so a run can be shared, replayed, or restored to the seeded state.

## What data would an organization need for a real deployment?

A real deployment would need scoped work-trace data with provenance, such as ticket status changes, approval events, workflow timestamps, system action logs, policy catalogs, role metadata, and approved excerpts from communication tools. It should not need passwords, unrestricted inbox access, broad chat history, API keys in the browser, or unrestricted write access.

## Would organizational data be safe?

The intended production model is based on least privilege and governance. A production deployment should use read-only connectors for discovery, strict role-based access control, human approval gates, execution tool allowlists, immutable audit logs, backend-only AI provider calls, and summarized AI inputs instead of raw sensitive records where possible.

## Can Samruna execute real enterprise actions today?

No. The current app executes in safe simulation mode only. Real execution would require production connectors, identity controls, approval policy, tool allowlists, observability, and customer-specific security review.

## How do I reset the POC?

From the product UI, open **Audit** and use **Reset**. For the backend-backed POC, you can also run `npm run backend:seed`.
