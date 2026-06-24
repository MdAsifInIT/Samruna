# 10. Demo Operations

## 10.1 Local Demo Command

Start the demo:

```powershell
npm run demo:dev
```

Open the local URL printed by Vite.

Local POC verification without browser automation:

```powershell
npm run verify:demo
```

That command typechecks, runs the test suite, builds the app, and audits dependencies. Use it as the non-browser verification gate in this environment.

Browser e2e verification:

```powershell
npm run test:e2e
```

That command starts the Vite app through Playwright, runs deterministic local Chromium tests, and verifies both golden scenarios plus localStorage reload and reset recovery.

Production-preview fallback:

```powershell
npm run build
npm run preview
```

## 10.2 Scenarios

Available scenarios:

- `IT access requests`: default access-request workflow with manager approval bottleneck, policy checks, provisioning mock, and audit logging.
- `Procurement intake`: software procurement, vendor onboarding, and invoice exception workflow with procurement, finance, legal, and policy review paths.

All scenario data is synthetic and stored in `src/fixtures/demoData.ts`.

## 10.3 Golden Path

1. Select `IT access requests`.
2. Click `Load Scenario`.
3. Click `Analyze`.
4. Inspect evidence, graph, patterns, and bottleneck.
5. Click `Generate Proposal`.
6. Review required data, forbidden data, assumptions, policy checks, escalations, simulation, and governance notes.
7. Click `Approve` or `Reject`.
8. Confirm the approval gate state changes.
9. Click `Run Mock` after approval.
10. Confirm mock tool calls, audit trail, and learning recommendation.
11. Click `Export Summary`.
12. Click `Reset`.
13. Switch to `Procurement intake` and repeat load, analyze, inspect graph, and proposal generation.

The Playwright e2e suite exercises this path for both scenarios with deterministic demo data. On failure, Playwright captures screenshots, videos, and traces for debugging; do not commit those artifacts unless they are intentionally attached to an investigation.

## 10.4 Reset And Seed

Normal operator reset:

- Click `Reset` in the app.

Seed helper:

```powershell
npm run demo:seed
npm run demo:seed -- procurement-intake
```

Browser reset snippet helper:

```powershell
npm run demo:reset
npm run demo:reset -- procurement-intake
```

The CLI helper prints deterministic JSON or a browser-console localStorage snippet. The app itself owns the normal reset path because the persisted state lives in the browser profile.

If you do have browser access, pair the CLI helpers with `npm run demo:dev` or `npm run preview` to confirm the seeded state in the UI.

The e2e suite also validates browser recovery behavior by reloading persisted localStorage state, then resetting the app and confirming generated run state stays cleared after another reload.

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

`Import Summary` restores a previously exported Work Graph Foundry run summary pasted into the import textbox.

Do not commit exported run summaries unless they are intentionally added as synthetic documentation examples.

## 10.6 Safety Notes

- The default AI provider is deterministic mock behavior.
- The browser demo does not need `OPENAI_API_KEY`.
- Live OpenAI calls, if added later, must be server-side only.
- Mock execution never mutates external systems and remains locked until governance approval.
- The demo does not need passwords, raw secrets, private message bodies, production write access, or unrestricted admin access.

## 10.7 Recovery

If the UI looks stale:

1. Click `Reset`.
2. Refresh the browser.
3. Restart `npm run demo:dev`.
4. Use `npm run build` and `npm run preview` as a fallback.
5. If localStorage still appears stale, run the Playwright e2e suite to validate reload and reset recovery.

If tests or build fail, run:

```powershell
npm run verify:demo
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
2. `npm run demo:dev` to confirm the app starts
3. `npm run verify:demo` to confirm typecheck, tests, build, and audit
4. `npm run demo:seed` and `npm run demo:reset` to confirm the operator helpers still emit deterministic output

When browser automation is available, `npm run test:e2e` and `npm run test:e2e:preview` are the browser verification gates. The commands require Playwright browser binaries; if Chromium is missing, install it after dependencies with `npm run test:e2e:install`.
