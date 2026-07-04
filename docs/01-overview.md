# 1. Overview

## 1.1 Purpose

Work Graph Foundry is a local-first enterprise work intelligence and governed automation demo. It shows how an AI-native operating layer can observe messy work traces, infer the real process, identify repeated work patterns, generate governed automation, simulate that automation, execute approved work safely, and recommend improvements.

The current demo opens with a customer-facing landing page rather than a chatbot. The first screen introduces the product and then moves into a `#demo` workspace with five primary views: Overview, Evidence, Graph, Review & Run, and Audit. The product is meant to feel like a real enterprise tool for process owners, IT operators, compliance reviewers, and automation teams. The landing story is reviewer-first and hackathon-friendly: it gives a fast path from claim to evidence to governed automation.

## 1.2 Product Problem

In large organizations, work moves through email, tickets, chat, spreadsheets, approvals, documents, and internal systems. Teams often know pieces of the process, but no one has a reliable live map of how work actually flows. This causes:

- hidden bottlenecks
- repeated manual coordination
- inconsistent approval paths
- audit gaps
- automation work that starts too late because humans first need to manually draw the workflow

Work Graph Foundry demonstrates a different loop: discover the workflow from work traces first, then propose and govern automation.

## 1.3 Current State

The repository currently contains a complete local MVP:

- React/Vite/TypeScript dashboard
- seeded IT access request and procurement intake fixture data
- typed domain contracts
- scenario selection and validation
- browser-local persisted demo state
- deterministic ingestion and normalization
- work graph generation
- pattern detection and bottleneck scoring
- governed automation proposal generation
- historical simulation
- governance approval and audit state
- safe mock execution
- learning-loop recommendation
- run summary export/import
- deterministic mock AI provider
- optional OpenAI Responses API provider boundary
- unit and component tests

The MVP is demo-ready and does not require enterprise credentials or an OpenAI API key.

## 1.4 Main User Flow

The golden path is:

1. User clicks `Launch` from the product page.
2. User chooses a scenario.
3. User clicks `Load Workflow`.
4. App validates seeded raw work traces and shows source evidence.
5. User clicks `Analyze`.
6. App normalizes traces, builds a work graph, and detects repeated patterns.
7. User clicks `Generate Proposal` and reviews the governed automation proposal in `Review & Run`.
8. User approves or rejects the proposal.
9. User runs the simulation after approval.
10. App executes a new request through safe mock tools only when governance allows it.
11. User opens `Audit` to review audit events and the learning-loop improvement.
12. User exports a run summary or clicks `Reset` to restore seeded state.

## 1.5 Agentic Loop

The product demonstrates these agentic behaviors:

- Observe: read raw traces and normalize them.
- Understand: group repeated work and identify request patterns.
- Map: build the work graph.
- Reason: calculate bottlenecks, opportunity, and risk.
- Plan: generate a structured automation proposal.
- Simulate: replay historical cases before execution.
- Govern: require approval and create audit events.
- Execute: run only approved workflows through mock tools.
- Improve: recommend a future proposal update.

## 1.6 What The Solution Is Not

The current MVP is not:

- a production connector platform
- a real provisioning system
- a general chatbot
- a workflow designer where the user draws every step
- a system that sends enterprise data to a model by default
- a multi-tenant enterprise SaaS implementation

Those are future directions, not current scope.

## 1.7 Repository Entry Points

Start with:

- `README.md` for quick setup and demo path.
- `docs/02-architecture.md` for how the app is built.
- `docs/03-development.md` for how to continue development.
- `docs/06-testing-and-validation.md` for test and agentic verification steps.
- `docs/10-demo-operations.md` for the operator runbook.

Important source files:

- `src/App.tsx`: dashboard orchestration.
- `src/domain/types.ts`: shared contracts.
- `src/domain/persistence.ts`: local demo state persistence.
- `src/fixtures/demoData.ts`: seeded synthetic scenario data.
- `src/ai/providers.ts`: mock and optional OpenAI provider boundary.

## 1.8 Current Demo Story

The default story centers on IT access requests:

- Employees request application access.
- Requests arrive through several channels.
- The process usually requires manager approval.
- Standard requests are repeatable.
- Privileged, contractor, finance, or exception cases need human review.
- The system discovers this pattern, proposes an automation, tests it, and executes only after governance approval.

The strongest demo moment is that the workflow is discovered from traces rather than predefined by the user.

The second scenario, procurement intake, demonstrates that the same domain pipeline can handle another realistic enterprise workflow without a backend or live connector. It keeps low-risk software procurement on a candidate fast path while vendor onboarding and invoice exceptions remain human-reviewed.
