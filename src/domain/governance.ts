import type { AuditEvent, AutomationProposal, GovernanceDecision, GovernanceRecord } from "./types";

export function createAuditEvent(input: {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
}): AuditEvent {
  return {
    id: input.id,
    timestamp: input.timestamp,
    actor: input.actor,
    action: input.action,
    detail: input.detail
  };
}

export function createGovernanceRecord(input: {
  proposal: AutomationProposal;
  decision: GovernanceDecision;
  reviewerRole: GovernanceRecord["reviewerRole"];
  comments: string;
  timestamp?: string;
}): GovernanceRecord {
  return {
    id: `governance-${input.proposal.id}-${input.decision}`,
    proposalId: input.proposal.id,
    reviewerRole: input.reviewerRole,
    decision: input.decision,
    comments: input.comments,
    timestamp: input.timestamp ?? new Date().toISOString(),
    proposalVersion: input.proposal.version
  };
}

export function canExecute(governanceRecords: GovernanceRecord[], proposal: AutomationProposal): boolean {
  return governanceRecords.some(
    (record) =>
      record.proposalId === proposal.id &&
      record.proposalVersion === proposal.version &&
      record.decision === "approved"
  );
}

export function auditFromGovernance(record: GovernanceRecord): AuditEvent {
  return {
    id: `audit-${record.id}`,
    timestamp: record.timestamp,
    actor: record.reviewerRole,
    action: `Proposal ${record.decision}`,
    detail: record.comments
  };
}
