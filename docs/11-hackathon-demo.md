# 11. Hackathon Demo

## 11.1 What "Production-Ready For A Hackathon" Means

For this repository, hackathon-ready means the demo is:

- local-first and self-contained
- deterministic by default
- safe to run without external services
- easy to rehearse in one browser session
- clear about what is real versus mocked
- verified with a short, repeatable command set

It does not mean the product is production-ready for enterprise use.

## 11.2 Safe Local Behavior Today

The current demo is safe for local and hackathon use because:

- the default AI provider is deterministic mock behavior
- the scenario data is synthetic
- no `OPENAI_API_KEY` is required
- execution uses mock tools only
- approvals and audit state stay inside browser localStorage
- reset, seed, import, and export are local operations

## 11.3 Real Production Still Requires

Before real production use, the product still needs:

- a server-side API layer
- server-side secret handling
- durable storage for traces, proposals, execution, and audit history
- authentication and role-based access control
- connector allowlists and scoped permissions
- production monitoring and rollback controls
- validated model output and auditable decision logging

## 11.4 Hackathon Demo Path

Use this sequence for a live demo:

1. Start with `npm run demo:dev`.
2. Open the printed local URL and click `Launch`.
3. Select `IT access requests` for the default story.
4. Click `Load workflow`.
5. Click `Analyze workflow` and point out the `Evidence` and `Graph` views.
6. Click `Generate automation proposal` and review `Review & Run`.
7. Click `Approve`.
8. Click `Run simulation` and emphasize that no external system changes.
9. Open `Audit`, then click `Export Summary` to show portable demo state.
10. Click `Reset workflow state` to prove the demo can be replayed.
11. Switch to `Procurement intake` if you want a second scenario.

Short talk track:

"This demo observes messy work traces, finds repeated patterns in an organization, turns them into governed automation, simulates them against history, requires human approval, executes safely through mock tools, and persists the result locally."

## 11.5 Verification Commands

Use these exact commands:

```powershell
npm install
npm run demo:dev
npm run verify:demo
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
npm run verify:demo
npm run build
npm run preview
```

If Playwright still cannot launch, treat the local demo plus `verify:demo` as the fallback hackathon readiness check and record the browser blocker in the handoff.
