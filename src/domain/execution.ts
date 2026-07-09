import type { AutomationProposal, ExecutionRun, LearningRecommendation, PolicyRule, RawWorkTrace, SimulationResult } from "./types";

export function runApprovedWorkflow(input: {
  proposal: AutomationProposal;
  requestTrace: RawWorkTrace;
  approved: boolean;
  scenario?: {
    id: string;
    label: string;
    workflowName: string;
  };
  policyRules?: PolicyRule[];
  simulation?: Pick<SimulationResult, "passed" | "needsHuman" | "policyRisk" | "avoidedDelayHours">;
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

  const workflowName = input.scenario?.workflowName ?? input.scenario?.label ?? input.requestTrace.metadata.system ?? "synthetic workflow";
  const ticketId = input.requestTrace.metadata.ticketId ?? input.requestTrace.caseId;
  const policySummary = summarizePolicies(input.policyRules, input.proposal);
  const actionSummary = input.proposal.actions.slice(0, 3).join("; ");
  const simulationSummary = input.simulation
    ? `${input.simulation.passed} historical cases passed; ${input.simulation.needsHuman + input.simulation.policyRisk} routed for review; ${input.simulation.avoidedDelayHours}h avoided delay.`
    : "No simulation summary was available.";

  return {
    id: `run-${input.requestTrace.caseId}`,
    proposalId: input.proposal.id,
    requestTraceId: input.requestTrace.id,
    status: "completed",
    mockToolCalls: [
      {
        tool: "trace-classifier.extract-request",
        input: input.requestTrace.subject,
        output: `${input.requestTrace.metadata.department} request captured for ${workflowName}`
      },
      {
        tool: "policy-catalog.evaluate",
        input: policySummary,
        output: input.simulation && input.simulation.policyRisk > 0 ? "eligible with exception review controls" : "eligible under selected policy controls"
      },
      {
        tool: "work-orchestrator.create-task",
        input: actionSummary,
        output: `simulated ${workflowName} task ${ticketId} created`
      },
      {
        tool: "audit-log.write",
        input: input.proposal.id,
        output: "audit event recorded"
      }
    ],
    auditTrail: [
      "Confirmed proposal approval.",
      `Validated request eligibility for ${workflowName}.`,
      simulationSummary,
      "Created simulated execution task.",
      "Recorded execution audit event."
    ]
  };
}

function summarizePolicies(policyRules: PolicyRule[] | undefined, proposal: AutomationProposal): string {
  const labels = policyRules?.length ? policyRules.map((policy) => policy.label) : proposal.policyChecks;

  return labels.length ? labels.slice(0, 4).join("; ") : "No explicit policy checks were selected.";
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
