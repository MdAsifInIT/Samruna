# 11. Hackathon POC (HCLTech-OpenAI Agentic AI Hackathon)

## 11.1 What "Production-Ready For A Hackathon" Means

For this repository, hackathon-ready means the POC is:
- **Hosted and Live:** Reviewers can click a link and immediately test the Agentic AI workflow without configuring a local environment.
- **Deterministic and Safe:** Defaulting to a simulated environment to prove safety without external enterprise risks.
- **Easy to Rehearse:** Clear start-to-finish flows for the pitch.
- **Clear on AI Bounds:** Explicit about what the OpenAI model controls (proposals/planning) versus what is gated by humans (approval/execution).

## 11.2 The Live Pitch Path

For the live pitch or for judges reviewing the project asynchronously, use the hosted Live Demo.

- **Frontend:** `https://mdasifinit.github.io/Samruna/`
- **Backend:** `https://samruna-api.onrender.com`

**Sequence for a Live POC Pitch:**
1. Open the **Frontend URL** and click `Launch`.
2. Select `IT access requests` for the default story (or highlight other seeded scenarios like `Procurement intake`).
3. Click `Load workflow`.
4. Click `Analyze workflow`. Point out the `Evidence` and `Graph` views—explain how this translates messy traces into a readable process.
5. Click `Generate automation proposal` and review `Review & Run`.
   - **Crucial Pitch Moment:** Explain that this is where the **Agentic AI** steps in. The OpenAI backend acts as a reasoning engine, planning the triggers, policies, and actions based on the graph.
6. Emphasize **Governance** (HCLTech focus). Point out that the Agentic AI cannot act on its own. It requires the `Approve` button to be clicked.
7. Click `Approve`.
8. Click `Execute workflow`. Emphasize that execution happens in a **Safe Simulation** to avoid enterprise risks.
9. Open `Audit`, then click `Export Summary` to show the transparent audit trail.
10. Click `Reset workflow state` to prove the POC can be safely replayed.

**Short Talk Track:**
"Samruna solves enterprise workflow bottlenecks by observing messy operational traces and translating them into a clear graph. From there, we leverage OpenAI as an Agentic Reasoning Engine to automatically generate a governed automation proposal. Because HCLTech enterprise clients demand safety, our AI doesn't act blindly—it proposes a plan, requires human approval, and executes in a safe simulation environment that generates a perfect audit trail."

## 11.3 Safe Local Behavior Today

If a judge chooses to evaluate the repository locally, the local POC is safe because:
- The default AI provider is the deterministic Historical validation engine.
- Optional live OpenAI proposal and synthetic execution runs server-side only.
- The scenario data is synthetic.
- No `OPENAI_API_KEY` is strictly required to test the core UX flow.
- Reset, seed, import, and export are local operations.

## 11.4 Real Production Still Requires

Before real production use, the product still needs:
- server-side secret handling
- production-grade durable storage for traces, proposals, execution, and audit history
- authentication and role-based access control
- connector allowlists and scoped permissions
- production monitoring and rollback controls
- validated model output and auditable decision logging

## 11.5 Local Verification Commands (For Judges)

If judges wish to build and verify locally:

Install dependencies and seed the local backend:
```powershell
npm install
npm run backend:seed
```

Start the full-stack app in one shell:
```powershell
npm run dev:fullstack
```

Run verification commands in a separate shell:
```powershell
npm run verify:fullstack
npm run test:e2e
npm run typecheck:e2e
```

## 11.6 Optional Live OpenAI POC (Local Evaluation)

If you are running locally and wish to test the live OpenAI reasoning, set the key only in the backend shell:

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_MODEL="gpt-4o"
npm run backend:seed
npm run dev:fullstack
```

Do not paste keys into the browser, fixtures, docs, exported run summaries, or screenshots. Live OpenAI affects proposal and synthetic execution generation only.
