# 13. Backend Planning Loop Prompt

Historical reference: this planning prompt was used for the completed backend implementation loop.

## 13.1 Purpose

Use this prompt to start a fresh Codex chat for planning the backend implementation before any code is changed.

The prompt is intentionally planning-first. It should produce a decision-complete implementation plan for the demo-grade backend branch, using the repository's worker-orchestrator model without mutating application code during the planning pass.

## 13.2 Fresh Planning Prompt

Paste this into a new Codex App thread on branch `backend-branch`:

```text
You are the orchestrator/project manager for Work Graph Foundry.

Mode:
Planning only. Do not edit files, install dependencies, run migrations, generate code, or mutate repo-tracked state. You may inspect files, run read-only searches, and run non-mutating checks that improve the plan.

Goal:
Create a decision-complete implementation plan for the demo-grade full-stack backend described in docs/12-backend-implementation-plan.md.

Branch:
Confirm the current branch is backend-branch. If it is not, stop and report the mismatch before planning.

Operating model:
Use the worker-orchestrator model from AGENTS.md and .codex/config.toml.

Use subagents only when they add clear planning value:
- explorer or worker_major for architecture-sensitive read-only analysis.
- worker_nano for narrow read-only repo mapping if needed.
- worker_test for verification command planning or existing test inventory.

Do not let workers edit files during this planning pass.

Required reading:
- AGENTS.md
- README.md
- package.json
- docs/02-architecture.md
- docs/05-data-access-and-security.md
- docs/07-roadmap.md
- docs/09-agentic-build-guide.md
- docs/12-backend-implementation-plan.md
- src/domain/types.ts
- src/domain/persistence.ts
- src/app/useWorkGraphDemoController.ts
- src/fixtures/demoData.ts
- existing tests under src and tests

Planning loop:
Repeat the following loop until the plan is decision complete.

Loop 1: Grounding
- Inspect the current repo shape.
- Confirm current frontend flow, domain contracts, fixture shape, persistence shape, and test commands.
- Identify facts from the repo before asking questions.

Loop 2: Intent and boundary check
- Restate the backend goal, success criteria, audience, and out-of-scope boundaries.
- Keep real enterprise connectors, production auth, real provisioning, and real customer data out of scope.
- Ask only high-impact questions that cannot be answered from the repo.

Loop 3: Architecture contract
- Decide the backend runtime, local DB strategy, API route groups, state ownership, seed/reset behavior, and frontend data boundary.
- Define the minimum API capabilities needed for the existing demo flow.
- Preserve existing domain logic wherever practical.

Loop 4: Implementation decomposition
- Split work into bounded tasks with clear ownership.
- Assign each task to worker_major, worker_nano, or worker_test.
- Define file ownership boundaries to avoid workers editing the same files unnecessarily.
- Include the order of execution and integration checkpoints.

Loop 5: Verification and risk review
- Define required tests, commands, and expected outcomes.
- Identify likely blockers such as Node sqlite support, Playwright browser launch, package install/network failures, or branch/worktree conflicts.
- Add fallback decisions for each blocker.

Loop 6: Final plan
- Produce one complete implementation plan.
- Include summary, architecture decisions, API/data interfaces, implementation tasks, test plan, risks, assumptions, and exact fresh execution prompt.
- The execution prompt must tell the next chat to implement the plan from start to finish on backend-branch.

Output requirements:
- Do not implement.
- Do not produce partial plans as final.
- Final answer must include a single proposed_plan block.
- The plan must be decision complete enough for a separate Codex execution chat to implement without making architectural choices.
- Include a separate "Execution Prompt" section that can be copied into a fresh implementation chat.
```

## 13.3 Expected Output

The planning chat should finish with:

- selected backend architecture
- API and persistence boundaries
- worker task split
- implementation order
- verification commands
- known blockers and fallbacks
- copyable execution prompt for the implementation chat

The planning chat should not edit source files.
