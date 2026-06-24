import type { GraphEdge, GraphNode, NormalizedWorkItem, RiskLevel, WorkGraph } from "./types";

export function buildWorkGraph(items: NormalizedWorkItem[], patternId: string): WorkGraph {
  const total = items.length || 1;
  const exceptionCount = items.filter((item) => item.exceptions.length > 0).length;
  const provisionedCount = items.filter((item) => item.status === "provisioned").length;
  const humanReviewCount = items.filter((item) => item.status === "needs_human").length;

  const nodes: GraphNode[] = [
    node("node-requester", "actor", "Requester", total, "low"),
    node("node-manager-approval", "approval", "Manager approval", total, "medium"),
    node("node-policy-check", "policy", "Policy check", total, exceptionCount ? "medium" : "low"),
    node("node-it-provisioning", "system", "System action", provisionedCount, "low"),
    node("node-audit-log", "action", "Audit log", provisionedCount, "low"),
    node("node-exception-review", "exception", "Exception review", humanReviewCount, humanReviewCount ? "high" : "low"),
    node("node-outcome", "outcome", "Outcome", total, exceptionCount ? "medium" : "low")
  ];

  const approvalDelayHours = average(
    items.map((item) => (item.approvedAt ? hoursBetween(item.submittedAt, item.approvedAt) : 0))
  );
  const averageCycleTimeHours = average(
    items.map((item) => hoursBetween(item.submittedAt, item.completedAt ?? item.approvedAt ?? item.submittedAt))
  );
  const exceptionRate = exceptionCount / total;

  const edges: GraphEdge[] = [
    edge("edge-requester-approval", "node-requester", "node-manager-approval", "submits request", total, approvalDelayHours, 0),
    edge("edge-approval-policy", "node-manager-approval", "node-policy-check", "approval received", total, 1.2, exceptionRate),
    edge(
      "edge-policy-provisioning",
      "node-policy-check",
      "node-it-provisioning",
      "eligible for action",
      provisionedCount,
      1.1,
      0
    ),
    edge("edge-provisioning-audit", "node-it-provisioning", "node-audit-log", "write audit event", provisionedCount, 0.2, 0),
    edge(
      "edge-policy-exception",
      "node-policy-check",
      "node-exception-review",
      "requires human review",
      humanReviewCount,
      4.5,
      humanReviewCount / total
    ),
    edge("edge-audit-outcome", "node-audit-log", "node-outcome", "complete", provisionedCount, 0.1, 0),
    edge("edge-exception-outcome", "node-exception-review", "node-outcome", "manual decision", humanReviewCount, 2.8, 0)
  ];

  return {
    id: `graph-${patternId}`,
    patternId,
    nodes,
    edges,
    metrics: {
      averageCycleTimeHours: round(averageCycleTimeHours),
      exceptionRate: round(exceptionRate),
      approvalDelayHours: round(approvalDelayHours)
    }
  };
}

function node(id: string, kind: GraphNode["kind"], label: string, count: number, riskLevel: RiskLevel): GraphNode {
  return { id, kind, label, count, riskLevel };
}

function edge(
  id: string,
  source: string,
  target: string,
  label: string,
  count: number,
  averageDurationHours: number,
  exceptionRate: number
): GraphEdge {
  return {
    id,
    source,
    target,
    label,
    count,
    averageDurationHours: round(averageDurationHours),
    exceptionRate: round(exceptionRate)
  };
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
