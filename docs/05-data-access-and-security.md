# 5. Data Access And Security

## 5.1 Required Organization Access

The current MVP requires no organization access.

It does not connect to:

- email systems
- ticketing systems
- chat systems
- identity providers
- HR systems
- provisioning systems
- document repositories
- databases

All demo data is seeded locally in `src/fixtures/demoData.ts`. Browser-local demo run state is stored in localStorage so operators can reload, reset, export, or import a run summary.

## 5.2 What Data The Solution Needs In A Real Deployment

A production version would need read access to work traces such as:

- ticket records
- email metadata or approved message excerpts
- chat thread metadata or approved excerpts
- approval logs
- task events
- timestamps
- statuses
- owners and roles
- comments if available
- identity and employment status
- application catalog metadata
- policy catalog metadata
- provisioning task history
- procurement, vendor, or finance system identifiers for procurement workflows
- audit events

The system does not need unrestricted access to every document or message. It needs scoped work-trace data with provenance.

## 5.3 What The MVP Uses Today

The MVP uses local fixture fields:

- requester name
- department
- manager or approver
- target system
- request type
- urgency
- timestamps
- policy flags
- exceptions
- outcome
- raw trace text
- source channel
- synthetic vendor names, purchase request identifiers, and estimated amounts in the procurement scenario

This data is fictional and committed as demo fixtures.

## 5.4 What It Does Not Need

For the MVP, the solution does not need:

- passwords
- API keys
- customer production data
- employee private inbox access
- full chat history
- financial records
- HR personnel files
- real provisioning permissions
- write access to enterprise systems

For production, the solution should still avoid broad access. Use scoped connectors, least privilege, and source-specific retention rules.

## 5.5 Security Model In The MVP

Current safety controls:

- no live enterprise connectors
- no real write actions
- no browser-side secret usage
- browser-local persistence only
- deterministic mock AI provider by default
- typed proposal contract
- simulation before execution
- approval gate before execution
- audit event generation
- mock tool calls only

## 5.6 OpenAI And Data Handling

The browser demo does not send data to OpenAI.

`OpenAiResponsesProvider` exists as an integration boundary for trusted runtimes. A production integration should:

1. run server-side
2. own `OPENAI_API_KEY` securely
3. send only necessary fields
4. validate model output
5. log model-influenced decisions
6. fall back safely if the model call fails

## 5.7 Governance Controls

The product models governance as a first-class state:

- proposals have versions
- reviewers make decisions
- comments are recorded
- audit events are generated
- execution is blocked until approval exists

This is important because enterprise automation must be reviewable before it changes operational behavior.

## 5.8 Common Security And Compliance Questions

### 5.8.1 Does the MVP access real company systems?

No. It uses local fixture data only.

### 5.8.2 Does the MVP require an OpenAI API key?

No. The default provider is deterministic mock behavior.

### 5.8.3 Does the browser app expose secrets?

No. The docs explicitly prohibit exposing `OPENAI_API_KEY` in browser code.

### 5.8.4 Does the app perform real provisioning?

No. Execution creates mock tool call records only.

### 5.8.5 Can automation run before approval?

No. The execution gate checks governance records before running.

### 5.8.6 What data would a production connector need?

Only scoped work-trace data needed to reconstruct process flow: source metadata, timestamps, participants, status changes, approvals, policies, systems, exceptions, and outcomes.

### 5.8.7 Does the system need full email or chat history?

No. A production system should use scoped access, approved channels, filters, or exported traces. Broad mailbox or chat history access is not required for the product concept.

### 5.8.8 How are compliance reviewers represented?

The MVP represents them through governance records, reviewer roles, comments, proposal versions, and audit events.

### 5.8.9 What happens to high-risk cases?

Simulation classifies privileged or policy-sensitive cases as human-review or policy-risk paths. The planner includes escalations rather than straight-through automation.

### 5.8.10 How should data retention work in production?

Retention should be configurable by source and policy. Store enough provenance for auditability, but avoid retaining unnecessary raw content.

### 5.8.11 What is stored by the local demo?

The local demo stores selected scenario, staged workflow flags, generated graph, proposals, governance decisions, simulation result, mock execution result, learning recommendation, and audit events in browser localStorage.

### 5.8.12 Does reset delete production data?

No. Reset only restores the local browser demo state for the selected synthetic scenario. There is no production connector or write path.

### 5.8.13 Can run summaries contain real customer data?

They should not. Run summaries should only contain synthetic demo data unless a future production system adds approved export controls and redaction.

## 5.9 Production Security Checklist

Before productionizing:

- add authentication
- add role-based access control
- add connector-level least privilege
- add server-side secret management
- add persistent immutable audit logs
- add proposal versioning
- add model call logging
- add data retention policy
- add tool execution allowlists
- add approval policies per workflow risk level
