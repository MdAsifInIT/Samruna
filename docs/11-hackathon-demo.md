# 11. Hackathon Demo

## 11.1 What "Production-Ready For A Hackathon" Means

For this repository, hackathon-ready means the demo is:

- local-first and self-contained
- deterministic by default
- safe to run without external services
- easy to rehearse in one browser session
- clear about what is real versus safely simulated
- verified with a short, repeatable command set

It does not mean the product is production-ready for enterprise use.

## 11.2 Safe Local Behavior Today

The current demo is safe for local and hackathon use because:

- the default AI provider is the Historical validation engine
- optional live OpenAI proposal generation runs server-side only, with validation fallback wording in the UI
- the scenario data is synthetic
- no `OPENAI_API_KEY` is required
- execution uses safe simulation mode
- approvals and audit state stay inside local SQLite with a browser fallback mirror
- reset, seed, import, and export are local operations

## 11.3 Real Production Still Requires

Before real production use, the product still needs:

- server-side secret handling
- production-grade durable storage for traces, proposals, execution, and audit history
- authentication and role-based access control
- connector allowlists and scoped permissions
- production monitoring and rollback controls
- validated model output and auditable decision logging

## 11.4 Hackathon Demo Path

Use this sequence for a live demo:

1. Start with `npm run backend:seed`, then `npm run dev:fullstack`.
2. Open the printed local URL and click `Launch`.
3. Select `IT access requests` for the default story.
4. Click `Load workflow`.
5. Click `Analyze workflow` and point out the `Evidence` and `Graph` views.
6. Click `Generate automation proposal` and review `Review & Run`.
   - If `OPENAI_API_KEY` is set on the backend, point out live OpenAI proposal generation in the Overview provider metadata.
   - If no key is set, point out Historical validation engine proposal generation and the validation fallback wording in user-facing provider copy.
7. Click `Approve` in `Review & Run`.
8. Click `Execute workflow` and emphasize that no external system changes.
9. Open `Audit`, then click `Export Summary` to show portable demo state.
10. Click `Reset workflow state` in `Audit` to prove the demo can be replayed.
11. Switch to `Procurement intake` if you want a second scenario.

Short talk track:

"This demo observes messy synthetic work traces, finds repeated patterns in an organization, can use live server-side OpenAI reasoning to generate a governed proposal, validates that proposal against history, requires human approval, executes safely in simulation mode, and persists the result through a local API and SQLite."

The opening screen should read as a product landing page, not a shell: one visible `Launch` CTA, the landing impact metrics band, three workflow blocks, a connected automation path, a compact topbar status, and a proof band that points into the workspace.

## 11.5 Verification Commands

Use these exact commands:

```powershell
npm install
npm run backend:seed
npm run dev:fullstack
npm run verify:fullstack
npm run test:e2e
npm run test:e2e:preview
npm run typecheck:e2e
```

If Chromium is not installed:

```powershell
npm run test:e2e:install
```

If browser launch is blocked in the environment, use the non-browser gate plus the preview fallback:

```powershell
npm run verify:fullstack
npm run build
npm run preview:fullstack -- --port 4174
```

If Playwright still cannot launch, treat the local full-stack demo plus `verify:fullstack` as the fallback hackathon readiness check and record the browser blocker in the handoff.

## 11.6 Optional Live OpenAI Demo

For a local live-key demo, set the key only in the backend shell:

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_MODEL="gpt-5.5"
npm run backend:seed
npm run dev:fullstack
```

Do not paste keys into the browser, fixtures, docs, exported run summaries, or screenshots. Live OpenAI affects proposal generation only; enterprise connectors, auth/RBAC, live provisioning, real customer data, browser-side secrets, and real execution remain out of scope.
