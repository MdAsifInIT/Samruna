import type { ExecutionRun } from "./types";

export type ExecutionStatusPresentation = {
  label: string;
  headline: string;
  detail: string;
  tone: "neutral" | "success" | "warning" | "blocked";
};

export function executionStatusPresentation(status: ExecutionRun["status"]): ExecutionStatusPresentation {
  switch (status) {
    case "running":
      return { label: "Running", headline: "Simulation running", detail: "Simulated tool calls are being evaluated.", tone: "neutral" };
    case "completed":
      return { label: "Completed", headline: "Simulation completed", detail: "Simulated tool calls completed and the audit trail was recorded.", tone: "success" };
    case "needs_human":
      return { label: "Human review", headline: "Simulation needs human review", detail: "At least one simulated case requires a human decision.", tone: "warning" };
    case "blocked":
      return { label: "Blocked", headline: "Simulation blocked", detail: "Governance or policy controls prevented simulated tool calls.", tone: "blocked" };
    case "failed":
      return { label: "Failed", headline: "Simulation failed", detail: "The simulation did not complete; review the audit trail before retrying.", tone: "blocked" };
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
