# Codex Autonomous Implementation System

This folder contains the master prompt for having Codex plan and build Work Graph Foundry from an empty or early-stage repo through a working product demo.

Use `MASTER_AUTONOMOUS_IMPLEMENTATION_PROMPT.md` as the first prompt in a new Codex thread. It instructs Codex to:

- inspect the repo from scratch,
- create a phase-based implementation plan,
- save detailed markdown files for every phase,
- build the product phase by phase,
- verify each phase with tests and demo checks,
- maintain a decision log and progress tracker,
- produce a final demo package.

The prompt is designed for autonomous implementation, but it still tells Codex to stop for approval before destructive actions, secret handling, paid external services, or irreversible deployment changes.
