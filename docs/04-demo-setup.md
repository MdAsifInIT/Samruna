# 4. Demo Setup

## 4.1 Requirements

Required:

- Node.js 24 for the local backend and built-in `node:sqlite`.
- npm.
- Local browser.
- No external services.
- No OpenAI API key.
- No enterprise credentials.

Optional:

- Optional `OPENAI_API_KEY` for trusted backend-only live proposal generation. The browser demo does not use or receive it.

## 4.2 Local Run Steps

Install:

```powershell
npm install
```

Start the API-backed local demo:

```powershell
npm run backend:seed
npm run dev:fullstack
```

Open the printed local URL, then click `Launch` to enter the hash-backed demo workspace.

Fallback production path:

```powershell
npm run build
npm run preview:fullstack -- --port 4174
```

Use this fallback if Vite dev optimization is blocked by the environment.

Install Playwright Chromium if the local machine has not already done so:

```powershell
npm run test:e2e:install
```

Use `npm run test:e2e:preview` for the preview-backed Playwright path and `npm run typecheck:e2e` for the e2e TypeScript project.

## 4.3 Demo Walkthrough

### 4.3.1 Open The Product Page

Start with the landing page. Explain that Work Graph Foundry begins from traces, not a manually designed workflow, then click `Launch` to enter the local workspace.

Point out:

- scenario selector
- landing impact metrics band
- compact topbar status
- `Load workflow`
- `Analyze workflow`
- `Generate automation proposal`
- `Approve` and `Reject` in `Review & Run`
- `Execute workflow`
- `Export Summary` in `Audit`
- `Reset workflow state` in `Audit`
- Historical validation engine and validation fallback status
- safe simulation mode
- governed execution state
- five workspace views: `Overview`, `Evidence`, `Graph`, `Review & Run`, and `Audit`
- compact workflow context in the top bar instead of a shell-level action strip

### 4.3.2 Choose A Scenario

Use `IT access requests` for the default story. Use `Procurement intake` to show the same engine on software purchase, vendor onboarding, and invoice exception traces.

All names, tickets, vendors, systems, approvals, and amounts are synthetic.

### 4.3.3 Load Workflow Data

Click `Load workflow`.

Explain:

"The scenario data represents work spread across email, tickets, chat, approval logs, and system actions."

Show raw traces, cases, policies, approvals, and source channel counts.

### 4.3.4 Analyze Workflow

Click `Analyze workflow`.

Show normalized items, warnings, top system, and raw-to-normalized evidence.

Explain:

"The system converts messy traces into canonical work items with requester, department, request type, system, status, and source links."

This is the observe step.

### 4.3.5 Show The Work Graph

Explain:

"The work graph shows the process path: requester, manager approval, policy check, system action, audit log, exception review, and outcome."

This is the map step.

### 4.3.6 Show Pattern Detection

Explain:

"The system discovers repeated workflow patterns and identifies manager approval as a bottleneck."

This is the understand and reason step.

### 4.3.7 Generate The Proposal

Click `Generate automation proposal`.

Explain:

"The planner generates a structured automation proposal with trigger, required data, rules, actions, escalations, confidence, risk, expected value, audit rationale, and assumptions."

This is the plan step.

### 4.3.8 Show Simulation And Governance

Explain:

"The historical validation engine replays the proposal against prior cases before it can run."

Point out pass, needs-human, policy-risk, avoided delay, governance/security notes, and the validation fallback wording shown to the user when historical evidence is incomplete.

This is the simulate step.

### 4.3.9 Approve Or Reject

Click `Approve`.

Explain:

"Approval creates an audit event and opens the execution gate for this proposal version."

Optional branch: click `Reject` to show that the execution gate remains blocked.

This is the govern step.

### 4.3.10 Execute Workflow

Click `Execute workflow`.

Explain:

"The request runs through safe simulation mode. No real enterprise system is changed."

This is the execute step.

### 4.3.11 Show Learning And Audit

Explain:

"The learning loop recommends splitting exception-heavy cases into a human-review lane."

Show the persisted audit trail and exported run summary. Explain that the summary is portable demo state, not production evidence.

This is the improve step.

## 4.4 Reset And Recovery

Click `Reset workflow state` in `Audit` to replay the demo. In full-stack mode, reset clears generated backend state for the selected scenario, persists the deterministic seeded baseline to SQLite, and refreshes the browser fallback mirror.

Backend seed/reset helpers:

```powershell
npm run backend:seed
npm run backend:reset
```

Legacy browser-mirror helpers:

```powershell
npm run demo:seed
npm run demo:reset
```

If the app appears stale:

1. Refresh the browser.
2. Click `Reset`.
3. Restart the dev or preview server.
4. Rebuild with `npm run build`.

If live AI is unavailable:

Use the Historical validation engine. The demo is designed for this safe fallback path.

## 4.5 Presenter Talk Track

Short version:

"Work Graph Foundry observes how work actually moves, builds a live graph, finds repeated patterns and bottlenecks, proposes governed automation, validates it against history, requires human approval, executes safely in simulation mode, persists the audit trail locally, and learns from exceptions."

For a shorter hackathon talk track and the exact browser fallback path, see [Hackathon Demo](11-hackathon-demo.md).

## 4.6 Demo Acceptance Checklist

Before presenting:

- `npm run verify:demo` passes for non-browser verification.
- `npm run test:e2e` passes when browser launch is allowed.
- `npm run build` passes.
- `npm test` passes.
- Landing page renders first and `Launch` opens `#demo`.
- `Load workflow` renders source counts.
- `Analyze workflow` renders normalized evidence, graph, and patterns.
- `Generate automation proposal` renders proposal, simulation, and governance notes.
- `Approve` opens the execution gate in `Review & Run`.
- `Reject` keeps the execution gate blocked in `Review & Run`.
- `Execute workflow` shows the execution success banner and `Completed` execution gate after execution.
- Learning recommendation appears.
- `Export Summary` produces JSON in `Audit`.
- `Reset` restores seeded demo state in `Audit`.
- No API key is required.
- Mobile layout has no horizontal overflow.

If `npm run test:e2e` cannot launch Chromium in a sandboxed environment, request browser-launch permission or record the permission blocker in the handoff. Do not treat missing permission as a product failure.
