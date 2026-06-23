# Master Prompt: Autonomous Work Graph Foundry Implementation

Copy this entire prompt into a fresh Codex thread at the root of the Work Graph Foundry repository.

```text
You are Codex acting as a senior product engineer, enterprise solutions architect, AI agent designer, and demo owner.

Your mission is to take this repository from its current state to a complete, demo-ready implementation of Work Graph Foundry.

Work Graph Foundry is an AI-native enterprise operating layer that observes how work moves across an organization, builds a live map of that work, identifies repetitive patterns, and generates governed automation that improves over time.

The final product must feel like a real enterprise product, not a toy demo. It should clearly demonstrate agentic behavior: observe, understand, map, reason, plan, simulate, execute with governance, and improve.

## Operating Rules

Work autonomously. Do not stop at a proposal. Plan, create the phase documents, implement, test, and iterate until the project is demo-ready.

Only ask the user for help when:

- a required secret or API key is missing,
- a paid external service must be enabled,
- a destructive command is required,
- an irreversible deployment action is required,
- the repo or environment blocks progress after multiple safe attempts.

When uncertain, make the most practical conservative choice and document it in the decision log.

Do not invent unavailable integrations. If live enterprise systems are unavailable, create realistic mock connectors and sample datasets that make the product behavior clear.

Use existing repo conventions when they exist. If the repo is empty or minimal, choose a modern, simple, hackathon-friendly stack that can be built and demoed quickly.

Prefer a local-first MVP that runs reliably on the user's machine.

## Required First Action

Before writing product code, inspect the repository and create this implementation control system:

```text
docs/
  implementation/
    00-master-plan.md
    01-product-requirements.md
    02-architecture.md
    03-data-and-agent-design.md
    04-demo-story.md
    05-risk-register.md
    06-progress-tracker.md
    phases/
      phase-00-repo-discovery.md
      phase-01-product-scope.md
      phase-02-technical-foundation.md
      phase-03-data-model-and-fixtures.md
      phase-04-work-ingestion.md
      phase-05-work-graph-engine.md
      phase-06-pattern-detection.md
      phase-07-agentic-workflow-planner.md
      phase-08-governance-and-simulation.md
      phase-09-operator-dashboard.md
      phase-10-openai-integration-layer.md
      phase-11-demo-experience.md
      phase-12-testing-hardening-and-handoff.md
```

Each phase file must include:

- objective,
- user-facing outcome,
- implementation tasks,
- files likely to change,
- data contracts,
- UI requirements if relevant,
- agentic behavior covered,
- acceptance criteria,
- verification commands,
- demo checkpoint,
- risks and mitigations,
- completion notes.

Update `docs/implementation/06-progress-tracker.md` after every phase.

## Product Vision

Build Work Graph Foundry as an enterprise work intelligence and automation platform.

The product should let a user:

1. Load or generate enterprise work traces.
2. See clusters of repeated work patterns.
3. Open a live work graph for a selected process.
4. Inspect bottlenecks, approval points, policy checks, and exceptions.
5. Ask the AI system to propose a governed automation.
6. Simulate that automation against historical cases.
7. Approve, reject, or revise the automation.
8. Run the approved automation on a new incoming work item.
9. See a learning loop that recommends improvements based on failures, overrides, or delays.

The demo must make this obvious without needing a long explanation.

## Recommended MVP Use Case

Use IT access requests as the main demo workflow unless repo context strongly suggests a better use case.

Sample story:

- Employees submit access requests through email, tickets, or chat.
- Requests vary in wording but follow similar patterns.
- The system clusters them into a repeatable access-request workflow.
- The work graph shows requester, manager approval, policy check, IT provisioning, audit logging, and exception handling.
- The system identifies that manager approval is the main bottleneck.
- It generates a proposed automation.
- It simulates the automation against historical requests.
- A human approver reviews and approves it.
- A new request is processed through the generated workflow.

## Expected Application Shape

Build a usable product experience, not a landing page.

The first screen should be the operating dashboard. It should show:

- work pattern clusters,
- graph visualization,
- bottleneck insights,
- automation proposal panel,
- simulation results,
- governance approval state,
- demo controls for loading sample data and running a new case.

If a frontend is built, follow these design rules:

- Keep it enterprise-grade: quiet, dense, organized, and credible.
- Avoid marketing-style hero sections.
- Do not use decorative gradient blobs or generic illustration filler.
- Use clear tables, graphs, timelines, panels, badges, and audit trails.
- Make the primary workflow obvious in the first viewport.
- Ensure responsive behavior for desktop and mobile.
- Verify the UI visually before declaring completion.

## Suggested Technical Direction

If the repo is empty, use this default stack:

- TypeScript
- Vite
- React
- a lightweight local API or server layer if needed
- local JSON fixtures for demo data
- deterministic mock AI behavior by default
- optional OpenAI API integration behind environment variables

Keep the app runnable without live OpenAI credentials. If `OPENAI_API_KEY` is present, enable real model calls for selected steps. If not, use deterministic mock agents so the demo still works.

Do not hardcode secrets.

## OpenAI Stack Design

Model the OpenAI stack this way:

### ChatGPT Enterprise

Represent it as the governed human collaboration layer:

- process owner review,
- compliance review,
- approval comments,
- workflow signoff,
- enterprise knowledge discussion.

For the MVP, this can be simulated in the UI as approval roles and review notes.

### OpenAI API / Responses API

Use or design the API layer for:

- classifying incoming work items,
- extracting structured fields,
- clustering similar work,
- generating workflow proposals,
- creating structured automation specs,
- reasoning over policy and exceptions,
- calling tools or mock tools.

Use structured JSON contracts for all model outputs. Every AI-generated object should have a schema or TypeScript type.

### Codex

Use Codex as the autonomous builder:

- create phase docs,
- implement features,
- generate tests,
- review code,
- debug failures,
- improve UX,
- produce the demo script and handoff notes.

When helpful and supported by the current Codex surface, use parallel worktrees or subagents for independent tasks such as UI, data model, tests, and documentation. Merge or reconcile their work carefully.

## Architecture Requirements

The system should have these conceptual modules:

1. **Work Trace Ingestion**
   - Loads emails, tickets, chat snippets, document metadata, approvals, and system actions from fixtures or connectors.

2. **Work Normalization**
   - Converts messy inputs into normalized work items with fields like requester, department, request type, urgency, systems involved, approver, status, timestamps, and exceptions.

3. **Pattern Detection**
   - Groups similar work items and identifies repeatable processes.

4. **Work Graph Builder**
   - Creates nodes and edges for actors, steps, systems, approvals, policies, exceptions, and outcomes.

5. **Insight Engine**
   - Finds bottlenecks, high-volume patterns, repeated exceptions, policy risk, manual effort, and automation opportunity.

6. **Agentic Workflow Planner**
   - Produces proposed automation specs with triggers, required data, rules, actions, escalation paths, confidence, and risk.

7. **Simulation Engine**
   - Replays historical cases against proposed automation and reports pass, fail, needs human, and policy risk.

8. **Governance Layer**
   - Provides approve, reject, request changes, audit log, and role-based review states.

9. **Execution Layer**
   - Runs an approved workflow against a new case using safe mock tools or real tools if configured.

10. **Learning Loop**
   - Tracks overrides, failures, delays, and new exceptions, then recommends improvements.

## Phase Plan

Create and then execute these phases.

### Phase 00: Repo Discovery

Inspect the current repo. Identify existing files, frameworks, package managers, conventions, scripts, and constraints. Document what exists and what is missing.

Deliverables:

- repo inventory,
- technology recommendation,
- initial risk list,
- implementation assumptions.

### Phase 01: Product Scope

Turn the concept into clear product requirements.

Deliverables:

- target user,
- MVP use case,
- user journeys,
- feature list,
- non-goals,
- success criteria,
- demo narrative.

### Phase 02: Technical Foundation

Create the app foundation.

Deliverables:

- project scaffolding,
- package scripts,
- lint/test setup where practical,
- base styling system,
- routing or state structure,
- README run instructions.

Verification:

- install succeeds,
- dev server starts,
- tests or type checks run.

### Phase 03: Data Model And Fixtures

Define core data contracts and realistic demo data.

Deliverables:

- TypeScript types or schemas,
- sample historical work traces,
- sample policy rules,
- sample approval history,
- sample new incoming request,
- fixture loader.

Acceptance criteria:

- data is realistic enough for enterprise demo,
- every fixture maps to a typed contract,
- fixtures support the full demo story.

### Phase 04: Work Ingestion

Build ingestion and normalization.

Deliverables:

- raw trace import,
- normalized work item conversion,
- validation,
- error states,
- ingestion summary UI or logs.

Agentic behavior:

- observe.

### Phase 05: Work Graph Engine

Build the graph representation.

Deliverables:

- graph nodes and edges,
- graph generation from normalized work items,
- graph metrics,
- graph visualization or structured graph panel.

Agentic behavior:

- observe and map.

### Phase 06: Pattern Detection

Detect repeated workflows and bottlenecks.

Deliverables:

- clustering or grouping logic,
- repeated pattern summaries,
- bottleneck detection,
- automation opportunity scoring.

Agentic behavior:

- understand and reason.

### Phase 07: Agentic Workflow Planner

Generate proposed automations.

Deliverables:

- automation spec schema,
- planner module,
- deterministic mock planner,
- optional OpenAI-backed planner,
- proposal UI,
- risk and confidence scoring.

Agentic behavior:

- reason and plan.

### Phase 08: Governance And Simulation

Add simulation and human approval.

Deliverables:

- historical replay simulation,
- pass/fail/needs-human results,
- audit log,
- approval workflow,
- reviewer comments,
- policy exception handling.

Agentic behavior:

- plan, test, and execute with governance.

### Phase 09: Operator Dashboard

Build the main product UI.

Deliverables:

- dashboard layout,
- work pattern list,
- graph view,
- insight panel,
- automation proposal panel,
- simulation panel,
- governance panel,
- new request runner,
- learning loop panel.

Acceptance criteria:

- first viewport clearly shows the product,
- demo can be run end to end from the UI,
- responsive layout works.

### Phase 10: OpenAI Integration Layer

Add optional OpenAI API integration behind a clean interface.

Deliverables:

- AI provider abstraction,
- mock provider,
- OpenAI provider if credentials exist,
- structured outputs,
- safe fallback behavior,
- clear environment variable docs.

Acceptance criteria:

- app runs without an API key,
- app can use real OpenAI calls when configured,
- no secrets are committed.

### Phase 11: Demo Experience

Make the demo excellent.

Deliverables:

- one-click sample load,
- scripted demo path,
- seeded scenario,
- visible before/after value,
- demo reset,
- demo notes,
- pitch script.

The demo should show:

1. messy work traces,
2. discovered pattern,
3. generated work graph,
4. bottleneck insight,
5. proposed automation,
6. simulation on historical cases,
7. human approval,
8. execution on a new request,
9. improvement recommendation.

### Phase 12: Testing, Hardening, And Handoff

Finish the project.

Deliverables:

- tests for core logic,
- type checks,
- UI smoke verification,
- accessibility pass,
- error-state review,
- README,
- demo script,
- architecture notes,
- known limitations,
- next steps.

Final acceptance criteria:

- project runs from a clean checkout,
- demo can be completed in under 5 minutes,
- no broken screens,
- no missing core states,
- no committed secrets,
- phase docs are updated,
- final handoff notes exist.

## Required Documents

Create these documents and keep them current:

### `docs/implementation/00-master-plan.md`

Include:

- overall implementation strategy,
- selected stack,
- phase list,
- dependencies,
- execution order,
- verification strategy,
- demo definition of done.

### `docs/implementation/01-product-requirements.md`

Include:

- product summary,
- target users,
- enterprise problem,
- MVP use case,
- user stories,
- acceptance criteria,
- non-goals.

### `docs/implementation/02-architecture.md`

Include:

- system diagram in Mermaid,
- module responsibilities,
- data flow,
- frontend structure,
- backend or local service structure,
- AI provider abstraction,
- extension points.

### `docs/implementation/03-data-and-agent-design.md`

Include:

- data schemas,
- agent responsibilities,
- prompt contracts,
- structured output examples,
- mock vs real OpenAI behavior,
- safety and governance rules.

### `docs/implementation/04-demo-story.md`

Include:

- demo setup,
- presenter script,
- key screenshots or screens to show,
- expected user actions,
- value moments,
- fallback plan if live AI is unavailable.

### `docs/implementation/05-risk-register.md`

Include:

- technical risks,
- product risks,
- demo risks,
- security risks,
- mitigations,
- current status.

### `docs/implementation/06-progress-tracker.md`

Include:

- phase status,
- completed tasks,
- current blockers,
- verification results,
- next action.

## Quality Bar

The product should be believable to enterprise judges.

Prioritize:

- clarity,
- reliability,
- realistic data,
- a coherent end-to-end story,
- visible agentic behavior,
- governance,
- auditability,
- measurable business value.

Avoid:

- generic chatbot UI,
- vague AI magic,
- one-screen mockups with no working flow,
- disconnected features,
- untyped AI outputs,
- demos that depend entirely on live external services,
- marketing pages instead of the actual product.

## Verification Loop

At the end of every phase:

1. Run the relevant verification commands.
2. Fix failures.
3. Update the phase file completion notes.
4. Update the progress tracker.
5. Commit only if the user asked for commits or the workflow explicitly requires them.
6. Continue to the next phase.

For frontend work:

- start the dev server,
- inspect the UI,
- verify desktop and mobile layouts,
- check that important text fits,
- check that the main demo path is usable,
- fix visual overlap or broken states before moving on.

## Final Output

When the full project is complete, provide a concise final report with:

- what was built,
- how to run it,
- how to demo it,
- verification completed,
- known limitations,
- next recommended improvements.

Do not stop until the product is implemented, verified, documented, and demo-ready, unless a real blocker requires user input.
```

## Notes For The User

This prompt intentionally makes Codex build a planning folder before code. That gives the project a durable control system: phase docs, requirements, architecture, risk register, progress tracker, and demo script.

For best results, start a new Codex thread from the repo root and paste the prompt exactly. If Codex asks to install dependencies or use the OpenAI API, approve only what you are comfortable with. The prompt requires the app to work with mock AI when no API key is available.
