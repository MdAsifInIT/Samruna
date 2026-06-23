import type {
  ApprovalHistoryRecord,
  IngestionResult,
  IngestionSummary,
  NormalizationIssue,
  NormalizedWorkItem,
  RawWorkTrace,
  RequestType,
  SourceChannel,
  Urgency
} from "./types";

const channels: SourceChannel[] = ["email", "ticket", "chat", "approval_log", "system_action"];

const requestTypeLabels: Record<RequestType, string> = {
  standard_access: "standard_access",
  privileged_access: "privileged_access",
  contractor_access: "contractor_access",
  finance_system_access: "finance_system_access",
  analytics_access: "analytics_access",
  software_procurement: "software_procurement",
  vendor_onboarding: "vendor_onboarding",
  invoice_exception: "invoice_exception"
};

export function ingestWorkTraces(
  rawTraces: RawWorkTrace[],
  approvalHistory: ApprovalHistoryRecord[]
): IngestionResult {
  const grouped = groupByCase(rawTraces);
  const issues: NormalizationIssue[] = [];
  const items = Array.from(grouped.entries())
    .map(([caseId, traces]) => normalizeCase(caseId, traces, approvalHistory, issues))
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  return {
    items,
    issues,
    summary: summarizeIngestion(rawTraces, items, issues)
  };
}

function groupByCase(rawTraces: RawWorkTrace[]): Map<string, RawWorkTrace[]> {
  const grouped = new Map<string, RawWorkTrace[]>();

  for (const trace of rawTraces) {
    const traces = grouped.get(trace.caseId) ?? [];
    traces.push(trace);
    grouped.set(trace.caseId, traces);
  }

  return grouped;
}

function normalizeCase(
  caseId: string,
  traces: RawWorkTrace[],
  approvalHistory: ApprovalHistoryRecord[],
  issues: NormalizationIssue[]
): NormalizedWorkItem {
  const sorted = traces.slice().sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const primary = sorted.find((trace) => trace.channel === "email") ?? sorted[0];
  const ticket = sorted.find((trace) => trace.channel === "ticket");
  const approvalTrace = sorted.find((trace) => trace.channel === "approval_log");
  const systemAction = sorted.find((trace) => trace.channel === "system_action");
  const approval = approvalHistory.find((record) => record.caseId === caseId);
  const requestType = inferRequestType(ticket?.body ?? primary.body);
  const exceptions = extractExceptions(sorted);

  if (!primary.metadata.system) {
    issues.push({
      id: `${caseId}-missing-system`,
      caseId,
      severity: "error",
      message: "Missing target system metadata."
    });
  }

  if (!approvalTrace && !approval) {
    issues.push({
      id: `${caseId}-missing-approval`,
      caseId,
      severity: "warning",
      message: "No approval signal was found for this case."
    });
  }

  const requiresManualReview = exceptions.length > 0 && !systemAction;
  const status = systemAction ? "provisioned" : requiresManualReview ? "needs_human" : "manager_approved";

  return {
    id: `work-item-${caseId}`,
    caseId,
    requester: primary.actor,
    requesterDepartment: primary.metadata.department,
    requestType,
    urgency: primary.metadata.severity ?? "normal",
    systems: primary.metadata.system ? [primary.metadata.system] : [],
    approver: approval?.approver ?? approvalTrace?.actor,
    status,
    submittedAt: primary.occurredAt,
    approvedAt: approval?.decidedAt ?? approvalTrace?.occurredAt,
    completedAt: systemAction?.occurredAt,
    policyFlags: inferPolicyFlags(requestType, exceptions),
    exceptions,
    outcome: systemAction ? "approved" : requiresManualReview ? "manual_review" : "pending",
    sourceTraceIds: sorted.map((trace) => trace.id)
  };
}

function inferRequestType(text: string): RequestType {
  const normalized = text.toLowerCase();

  for (const [requestType, label] of Object.entries(requestTypeLabels) as Array<[RequestType, string]>) {
    if (normalized.includes(label)) {
      return requestType;
    }
  }

  if (normalized.includes("privileged")) {
    return "privileged_access";
  }

  if (normalized.includes("contractor")) {
    return "contractor_access";
  }

  if (normalized.includes("netsuite") || normalized.includes("finance")) {
    return "finance_system_access";
  }

  if (normalized.includes("looker") || normalized.includes("analytics")) {
    return "analytics_access";
  }

  if (normalized.includes("vendor_onboarding") || normalized.includes("vendor onboarding")) {
    return "vendor_onboarding";
  }

  if (normalized.includes("invoice_exception") || normalized.includes("invoice exception")) {
    return "invoice_exception";
  }

  if (normalized.includes("software_procurement") || normalized.includes("procurement") || normalized.includes("purchase")) {
    return "software_procurement";
  }

  return "standard_access";
}

function extractExceptions(traces: RawWorkTrace[]): string[] {
  const exceptions = new Set<string>();

  for (const trace of traces) {
    const match = trace.body.match(/Exception noted: ([^.]+)\./i);

    if (match?.[1]) {
      exceptions.add(match[1]);
    }
  }

  return Array.from(exceptions);
}

function inferPolicyFlags(requestType: RequestType, exceptions: string[]): string[] {
  const flags = new Set<string>();

  if (requestType === "privileged_access") {
    flags.add("security_review_required");
  }

  if (requestType === "contractor_access") {
    flags.add("contractor_expiry_required");
  }

  if (requestType === "finance_system_access") {
    flags.add("finance_audit_required");
  }

  if (requestType === "software_procurement") {
    flags.add("budget_check_required");
  }

  if (requestType === "vendor_onboarding") {
    flags.add("vendor_risk_review_required");
  }

  if (requestType === "invoice_exception") {
    flags.add("finance_exception_review_required");
  }

  if (exceptions.length > 0) {
    flags.add("exception_review_required");
  }

  return Array.from(flags);
}

function summarizeIngestion(
  rawTraces: RawWorkTrace[],
  items: NormalizedWorkItem[],
  issues: NormalizationIssue[]
): IngestionSummary {
  const sourceCounts = Object.fromEntries(channels.map((channel) => [channel, 0])) as Record<SourceChannel, number>;
  const systemCounts: Record<string, number> = {};
  const departmentCounts: Record<string, number> = {};

  for (const trace of rawTraces) {
    sourceCounts[trace.channel] += 1;
  }

  for (const item of items) {
    for (const system of item.systems) {
      systemCounts[system] = (systemCounts[system] ?? 0) + 1;
    }

    departmentCounts[item.requesterDepartment] = (departmentCounts[item.requesterDepartment] ?? 0) + 1;
  }

  return {
    rawTraceCount: rawTraces.length,
    normalizedItemCount: items.length,
    issueCount: issues.length,
    sourceCounts,
    systemCounts,
    departmentCounts
  };
}
