# 10. POC - Proof Of Concept Operations

## 10.1 Local POC - Proof Of Concept Command

Start the POC - Proof Of Concept:

```powershell
npm run backend:seed
npm run dev:fullstack
```

Open the local URL printed by Vite.

Prepare and start the deterministic presentation backup:

```powershell
npm run demo:backup
```

This command builds the production assets, recreates `.samruna/backup-demo.sqlite`, strips `OPENAI_API_KEY` from its child environment, resets seeded state, and starts the one-origin full-stack app at `http://127.0.0.1:4174`. Stop it with Ctrl+C; the launcher forwards shutdown signals to the server.

Local POC verification without browser automation:

```powershell
npm run verify:fullstack
```

That command typechecks, runs the app and backend test suites, builds the app, and audits dependencies. Use it as the non-browser verification gate in this environment.

Browser e2e verification:

```powershell
npm run test:e2e
```

That command starts the full-stack app through Playwright, runs deterministic local Chromium tests, and verifies the golden browser scenarios plus menu navigation, backend workspace readback, browser mirror reload, reset recovery, export/import, rejection, and mobile overflow.

Production-preview fallback:

```powershell
npm run build
npm run preview:fullstack -- --port 4174
```

For the compact hackathon talk track, safe/local scope, and browser fallback steps, see [Hackathon POC - Proof Of Concept](11-hackathon-demo.md).

## 10.2 Scenarios

Available scenarios:

- `it-access`: default access-request workflow with manager approval bottleneck, policy checks, safe simulated provisioning, and audit logging.
- `procurement-intake`: software procurement intake with policy review paths and approval routing.
- `vendor-onboarding`: supplier setup workflow with compliance review and cross-functional checks.
- `invoice-exceptions`: invoice discrepancy workflow with finance escalation and exception handling.

All scenario data is synthetic and stored in `src/fixtures/demoData.ts`.

## 10.3 Golden Path

1. Click `Launch` from the product page.
2. Select `IT access requests`.
3. Click `Load Workflow`.
4. Confirm Evidence shows loaded source counts and channel evidence.
5. Click `Analyze`.
6. Inspect Graph for graph nodes, patterns, bottlenecks, and opportunity/risk signals.
7. Open Evidence if normalized evidence needs to be shown.
8. Click `Generate Proposal`.
9. Review Review & Run for required data, forbidden data, assumptions, eligibility rules, policy checks, escalations, actions, proposal status, versions, and the technical details disclosure.
10. Confirm the shell progress stepper shows staged progress and Overview shows the before/after impact panel.
11. Click `Approve` or `Reject` in `Review & Run`.
12. Confirm the approval gate state changes.
13. Click `Run simulation` after approval.
14. Confirm Review & Run shows the truthful simulation result, incoming request, simulated tool calls, execution audit trail, learning recommendation, and the matching execution gate state.
15. Open Audit and click `Export Summary`.
16. Confirm the exported run summary JSON appears.
17. Click `Reset` in `Audit`.
18. Confirm generated output clears from Graph, Review & Run, and Audit.
19. Switch to `procurement-intake`, `vendor-onboarding`, and `invoice-exceptions` as needed and repeat load, analyze, inspect graph, and proposal generation.

The Playwright e2e suite exercises the golden browser path with deterministic POC - Proof Of Concept data and the menu-based shell. On failure, Playwright captures screenshots, videos, and traces for debugging; do not commit those artifacts unless they are intentionally attached to an investigation.

The landing page that starts this path should show one visible `Launch` CTA, the landing impact metrics band, three workflow blocks, a connected automation path, and a proof band action that also enters `/dashboard`.

## 10.4 Reset And Seed

Normal operator reset:

- Click `Reset` in the app.

Backend seed/reset helper:

```powershell
npm run backend:seed
npm run backend:reset
```

Legacy browser-mirror helper:

```powershell
npm run demo:seed
npm run demo:reset
```

The backend helpers seed or reset SQLite state. The legacy browser helpers print deterministic JSON or a browser-console `localStorage` snippet for fallback-only recovery.

If you do have browser access, pair the CLI helpers with `npm run dev:fullstack` or `npm run preview:fullstack` to confirm the seeded state in the UI.

The e2e suite validates backend workspace readback plus browser mirror recovery by reloading persisted state, opening the relevant menu views, then resetting the app and confirming generated run state stays cleared after another reload.

## 10.5 Import And Export

`Export Summary` writes JSON to the dashboard textbox. It includes:

- selected scenario
- staged operator flags
- generated graph
- proposal
- governance records
- simulation
- execution result
- recommendation
- audit events

`Import Summary` restores a previously exported Samruna run summary pasted into the import textbox.

Do not commit exported run summaries unless they are intentionally added as synthetic documentation examples.

## 10.6 Safety Notes

- The default AI provider is the Historical validation engine.
- The backend can use OpenAI Responses API proposal and execution generation when `OPENAI_API_KEY` is set.
- The browser POC - Proof Of Concept does not need `OPENAI_API_KEY`.
- Live OpenAI calls, if added later, must be server-side only.
- Execution uses safe simulation mode and never mutates external systems.
- The POC - Proof Of Concept does not need passwords, raw secrets, private message bodies, production write access, or unrestricted admin access.

## 10.7 Recovery

If the UI looks stale:

1. Click `Reset`.
2. Refresh the browser.
3. Restart `npm run dev:fullstack`.
4. Use the Overview menu to confirm the current scenario state, then open Graph, Review & Run, and Audit to check whether generated artifacts remain.
5. Stop any process using port 4174, then run `npm run demo:backup` and open `http://127.0.0.1:4174`.
6. If backend or browser mirror state still appears stale, run the Playwright e2e suite to validate reload and reset recovery.

If tests or build fail, run:

```powershell
npm run verify:demo
npm run verify:fullstack
```

Fix deterministic domain failures before changing the UI.

If browser e2e fails, run:

```powershell
npm run test:e2e:install
npm run typecheck:e2e
npm run test:e2e
npm run test:e2e:preview
```

Review the failure screenshot, video, and trace before changing application behavior.

## 10.8 Browserless POC Verification

When browser automation is not available, verify the local POC with:

1. `npm install`
2. `npm run backend:seed` to initialize local SQLite state
3. `npm run dev:fullstack` or `npm run preview:fullstack -- --port 4174` to confirm the API-backed app starts
4. `npm run verify:fullstack` to confirm typecheck, app tests, backend tests, build, and audit
5. `npm run backend:reset` to confirm the backend operator helper restores deterministic output

## 10.9 Presenter Preflight

1. Run `npm ci`, `npm run verify:fullstack`, and `npm run test:e2e:preview` before demo day.
2. Open the public frontend and confirm `/api/health` succeeds on the Render backend.
3. Confirm the persistent demo-boundary and simulated-execution labels are visible.
4. Rehearse the golden path once, including reset confirmation and a non-completed simulation state.
5. Start `npm run demo:backup` in a separate terminal and keep `http://127.0.0.1:4174` ready as the local fallback.
6. If the public API is cold or unavailable, switch to the local backup; do not add a live key during the presentation.

When browser automation is available, `npm run test:e2e` and `npm run test:e2e:preview` are the browser verification gates. The commands require Playwright browser binaries; if Chromium is missing, install it after dependencies with `npm run test:e2e:install`.
