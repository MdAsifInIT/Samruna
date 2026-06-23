import type { AutomationProposal, ExecutionRun, LearningRecommendation, RawWorkTrace, SimulationResult } from "./types";

export function runApprovedWorkflow(input: {
  proposal: AutomationProposal;
  requestTrace: RawWorkTrace;
  approved: boolean;
}): ExecutionRun {
  if (!input.approved) {
    return {
      id: `run-${input.requestTrace.caseId}-blocked`,
      proposalId: input.proposal.id,
      requestTraceId: input.requestTrace.id,
      status: "blocked",
      mockToolCalls: [],
      auditTrail: ["Execution blocked because the proposal has not been approved."]
    };
  }

  const system = input.requestTrace.metadata.system ?? "unknown system";
  const ticketId = input.requestTrace.metadata.ticketId ?? input.requestTrace.caseId;

  return {
    id: `run-${input.requestTrace.caseId}`,
    proposalId: input.proposal.id,
    requestTraceId: input.requestTrace.id,
    status: "completed",
    mockToolCalls: [
      {
        tool: "employee-directory.validate",
        input: input.requestTrace.actor,
        output: "active employee"
      },
      {
        tool: "policy-catalog.evaluate",
        input: `${system} standard access`,
        output: "eligible with manager approval"
      },
      {
        tool: "work-orchestrator.create-task",
        input: `${input.requestTrace.actor} -> ${system}`,
        output: `mock task ${ticketId} created`
      },
      {
        tool: "audit-log.write",
        input: input.proposal.id,
        output: "audit event recorded"
      }
    ],
    auditTrail: [
      "Confirmed proposal approval.",
      "Validated request eligibility.",
      "Created mock provisioning task.",
      "Recorded execution audit event."
    ]
  };
}

export function recommendLearningUpdate(input: {
  simulation: SimulationResult;
  execution: ExecutionRun;
}): LearningRecommendation {
  if (input.execution.status === "blocked") {
    return {
      id: "learning-blocked-approval",
      source: "delay",
      recommendation: "Add approval reminders when proposal review remains pending.",
      expectedImpact: "Reduces time-to-automation for low-risk patterns.",
      riskLevel: "low",
      suggestedProposalChange: "Add reviewer reminder after 24 hours."
    };
  }

  if (input.simulation.needsHuman > 0) {
    return {
      id: "learning-exception-routing",
      source: "exception",
      recommendation: "Split exception-heavy cases into a separate human-review lane.",
      expectedImpact: "Keeps straight-through access fast while preserving control on exceptions.",
      riskLevel: "medium",
      suggestedProposalChange: "Add explicit exception lane for finance, contractor, and privileged flags."
    };
  }

  return {
    id: "learning-standard-fast-path",
    source: "delay",
    recommendation: "Expand standard-access fast path to adjacent approved systems.",
    expectedImpact: "Increases automation coverage without changing risk posture.",
    riskLevel: "low",
    suggestedProposalChange: "Add approved catalog systems with the same manager approval gate."
  };
}
