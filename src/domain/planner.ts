import type {
  AutomationOpportunity,
  AutomationProposal,
  BottleneckInsight,
  PolicyRule,
  WorkGraph,
  WorkPattern
} from "./types";

export function generateAutomationProposal(input: {
  pattern: WorkPattern;
  graph: WorkGraph;
  policyRules: PolicyRule[];
  bottleneck: BottleneckInsight;
  opportunity: AutomationOpportunity;
  version?: number;
  changeSummary?: string;
  generatedAt?: string;
}): AutomationProposal {
  const applicablePolicies = input.policyRules.filter((policy) =>
    policy.appliesTo.some((requestType) => input.pattern.requestTypes.includes(requestType))
  );
  const requiresHumanReview = applicablePolicies.some((policy) => policy.requiresHumanReview) || input.pattern.riskLevel !== "low";
  const escalationRoles = Array.from(new Set(applicablePolicies.map((policy) => policy.escalationRole)));
  const version = input.version ?? 1;

  return {
    id: `proposal-${input.pattern.id}-v${version}`,
    patternId: input.pattern.id,
    trigger: `New ${input.pattern.label.toLowerCase()} request with complete requester, manager, system, and urgency fields`,
    requiredData: ["requester", "department", "manager", "target system", "urgency", "employment status", "policy catalog match"],
    eligibilityRules: buildEligibilityRules(requiresHumanReview),
    policyChecks: applicablePolicies.map((policy) => policy.label),
    actions: [
      "Validate requester employment status",
      "Confirm manager approval or request approval",
      "Evaluate policy rules and exception flags",
      "Create provisioning task for eligible requests",
      "Write immutable audit event"
    ],
    escalations: buildEscalations(escalationRoles, requiresHumanReview),
    confidence: calculateConfidence(input.pattern, input.opportunity),
    riskLevel: input.pattern.riskLevel,
    expectedValue: `${Math.round(input.opportunity.score * 100)} opportunity score; targets ${input.bottleneck.averageDelayHours}h average approval delay.`,
    auditRationale: `${input.pattern.label} appears ${input.pattern.volume} times with ${Math.round(
      input.pattern.repeatabilityScore * 100
    )}% repeatability. The planner keeps ${requiresHumanReview ? "policy-sensitive" : "exception"} cases under human governance.`,
    version,
    changeSummary: input.changeSummary,
    generatedAt: input.generatedAt
  };
}

function buildEligibilityRules(requiresHumanReview: boolean): string[] {
  const baseRules = [
    "Requester has active employee status",
    "Target system exists in approved application catalog",
    "Manager approval is present or can be requested",
    "No missing requester, department, system, or urgency fields"
  ];

  if (requiresHumanReview) {
    return [...baseRules, "Policy-sensitive requests route to human review before provisioning"];
  }

  return [...baseRules, "No privileged role, contractor exception, finance exception, or unresolved policy flag is present"];
}

function buildEscalations(escalationRoles: string[], requiresHumanReview: boolean): string[] {
  const escalations = escalationRoles.map((role) => `Escalate to ${role.replace("_", " ")}`);

  if (requiresHumanReview) {
    escalations.push("Hold provisioning until reviewer approval is recorded");
  } else {
    escalations.push("Escalate unresolved exceptions to IT operations");
  }

  return Array.from(new Set(escalations));
}

function calculateConfidence(pattern: WorkPattern, opportunity: AutomationOpportunity): number {
  const confidence = pattern.repeatabilityScore * 0.55 + opportunity.score * 0.3 + (pattern.riskLevel === "low" ? 0.15 : 0.05);

  return Math.round(Math.min(0.95, confidence) * 100) / 100;
}
