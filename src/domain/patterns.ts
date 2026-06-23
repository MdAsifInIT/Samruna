import type {
  AutomationOpportunity,
  BottleneckInsight,
  NormalizedWorkItem,
  PatternDetectionResult,
  RequestType,
  RiskLevel,
  WorkPattern
} from "./types";

export function detectWorkPatterns(items: NormalizedWorkItem[]): PatternDetectionResult {
  const groups = groupItems(items);
  const patterns = Array.from(groups.entries())
    .map(([requestType, groupItemsForType]) => createPattern(requestType, groupItemsForType, items.length))
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

  const bottlenecks = patterns.map((pattern) => createBottleneck(pattern, groups.get(pattern.requestTypes[0]) ?? []));
  const opportunities = patterns.map((pattern) => createOpportunity(pattern));

  return { patterns, bottlenecks, opportunities };
}

function groupItems(items: NormalizedWorkItem[]): Map<RequestType, NormalizedWorkItem[]> {
  const groups = new Map<RequestType, NormalizedWorkItem[]>();

  for (const item of items) {
    const group = groups.get(item.requestType) ?? [];
    group.push(item);
    groups.set(item.requestType, group);
  }

  return groups;
}

function createPattern(requestType: RequestType, items: NormalizedWorkItem[], totalItems: number): WorkPattern {
  const volume = items.length;
  const exceptionRate = items.filter((item) => item.exceptions.length > 0).length / volume;
  const approvalDelay = average(items.map((item) => (item.approvedAt ? hoursBetween(item.submittedAt, item.approvedAt) : 0)));
  const repeatabilityScore = round(Math.min(1, volume / Math.max(3, totalItems * 0.35)) * (1 - exceptionRate * 0.35));
  const riskLevel = getRiskLevel(exceptionRate, requestType);
  const riskAdjustment = riskLevel === "high" ? 0.45 : riskLevel === "medium" ? 0.72 : 1;
  const opportunityScore = round(
    Math.min(
      1,
      (volume / totalItems) * 0.35 + repeatabilityScore * 0.35 + Math.min(1, approvalDelay / 72) * 0.3
    ) * riskAdjustment
  );

  return {
    id: `pattern-${requestType}`,
    label: labelForRequestType(requestType),
    requestTypes: [requestType],
    volume,
    repeatabilityScore,
    opportunityScore,
    riskLevel,
    bottleneck: "Manager approval",
    representativeCaseIds: items.slice(0, 3).map((item) => item.caseId)
  };
}

function createBottleneck(pattern: WorkPattern, items: NormalizedWorkItem[]): BottleneckInsight {
  const approvalDelays = items.map((item) => (item.approvedAt ? hoursBetween(item.submittedAt, item.approvedAt) : 0));
  const averageDelayHours = round(average(approvalDelays));
  const affectedCaseCount = approvalDelays.filter((delay) => delay >= 24).length;

  return {
    id: `bottleneck-${pattern.id}`,
    patternId: pattern.id,
    label: "Manager approval delay",
    averageDelayHours,
    affectedCaseCount,
    evidence: `${affectedCaseCount} of ${items.length} cases waited at least 24 hours for manager approval.`
  };
}

function createOpportunity(pattern: WorkPattern): AutomationOpportunity {
  const volume = round(Math.min(1, pattern.volume / 10));
  const repeatability = pattern.repeatabilityScore;
  const delay = pattern.opportunityScore > 0.5 ? 0.82 : 0.55;
  const riskAdjustment = pattern.riskLevel === "high" ? 0.45 : pattern.riskLevel === "medium" ? 0.72 : 1;

  return {
    id: `opportunity-${pattern.id}`,
    patternId: pattern.id,
    score: pattern.opportunityScore,
    valueSummary:
      pattern.riskLevel === "low"
        ? "Strong candidate for governed straight-through automation after approval."
        : "Candidate for partial automation with human review on policy-sensitive cases.",
    scoreComponents: {
      volume,
      repeatability,
      delay,
      riskAdjustment
    }
  };
}

function getRiskLevel(exceptionRate: number, requestType: RequestType): RiskLevel {
  if (requestType === "privileged_access") {
    return "high";
  }

  if (
    requestType === "contractor_access" ||
    requestType === "finance_system_access" ||
    requestType === "vendor_onboarding" ||
    requestType === "invoice_exception" ||
    exceptionRate >= 0.3
  ) {
    return "medium";
  }

  return "low";
}

function labelForRequestType(requestType: RequestType): string {
  const labels: Record<RequestType, string> = {
    standard_access: "Standard application access",
    privileged_access: "Privileged access review",
    contractor_access: "Contractor access review",
    finance_system_access: "Finance system access",
    analytics_access: "Analytics access",
    software_procurement: "Software procurement intake",
    vendor_onboarding: "Vendor onboarding review",
    invoice_exception: "Invoice exception review"
  };

  return labels[requestType];
}

function average(values: number[]): number {
  const populated = values.filter((value) => Number.isFinite(value));

  if (!populated.length) {
    return 0;
  }

  return populated.reduce((sum, value) => sum + value, 0) / populated.length;
}

function hoursBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
