export type SourceChannel = "email" | "ticket" | "chat" | "approval_log" | "system_action";

export type WorkStatus =
  | "submitted"
  | "manager_approved"
  | "policy_review"
  | "provisioned"
  | "rejected"
  | "needs_human";

export type Urgency = "low" | "normal" | "high";

export type RiskLevel = "low" | "medium" | "high";

export type RequestType =
  | "standard_access"
  | "privileged_access"
  | "contractor_access"
  | "finance_system_access"
  | "analytics_access"
  | "software_procurement"
  | "vendor_onboarding"
  | "invoice_exception";

export type ScenarioId = "it-access" | "procurement-intake";

export interface RawWorkTrace {
  id: string;
  caseId: string;
  channel: SourceChannel;
  occurredAt: string;
  actor: string;
  participants: string[];
  subject: string;
  body: string;
  metadata: {
    department: string;
    system?: string;
    ticketId?: string;
    region?: string;
    severity?: Urgency;
  };
}

export interface NormalizedWorkItem {
  id: string;
  caseId: string;
  requester: string;
  requesterDepartment: string;
  requestType: RequestType;
  urgency: Urgency;
  systems: string[];
  approver?: string;
  status: WorkStatus;
  submittedAt: string;
  approvedAt?: string;
  completedAt?: string;
  policyFlags: string[];
  exceptions: string[];
  outcome: "approved" | "rejected" | "pending" | "manual_review";
  sourceTraceIds: string[];
}

export type GraphNodeKind = "actor" | "approval" | "policy" | "system" | "action" | "exception" | "outcome";

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  count: number;
  riskLevel: RiskLevel;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  count: number;
  averageDurationHours: number;
  exceptionRate: number;
}

export interface WorkGraph {
  id: string;
  patternId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: {
    averageCycleTimeHours: number;
    exceptionRate: number;
    approvalDelayHours: number;
  };
}

export interface WorkPattern {
  id: string;
  label: string;
  requestTypes: RequestType[];
  volume: number;
  repeatabilityScore: number;
  opportunityScore: number;
  riskLevel: RiskLevel;
  bottleneck: string;
  representativeCaseIds: string[];
}

export interface BottleneckInsight {
  id: string;
  patternId: string;
  label: string;
  averageDelayHours: number;
  affectedCaseCount: number;
  evidence: string;
}

export interface AutomationOpportunity {
  id: string;
  patternId: string;
  score: number;
  valueSummary: string;
  scoreComponents: {
    volume: number;
    repeatability: number;
    delay: number;
    riskAdjustment: number;
  };
}

export interface PatternDetectionResult {
  patterns: WorkPattern[];
  bottlenecks: BottleneckInsight[];
  opportunities: AutomationOpportunity[];
}

export interface AutomationProposal {
  id: string;
  patternId: string;
  trigger: string;
  requiredData: string[];
  eligibilityRules: string[];
  policyChecks: string[];
  actions: string[];
  escalations: string[];
  confidence: number;
  riskLevel: RiskLevel;
  expectedValue: string;
  auditRationale: string;
  version: number;
  changeSummary?: string;
  generatedAt?: string;
}

export type SimulationCaseStatus = "pass" | "fail" | "needs_human" | "policy_risk";

export interface SimulationResult {
  proposalId: string;
  totalCases: number;
  passed: number;
  failed: number;
  needsHuman: number;
  policyRisk: number;
  avoidedDelayHours: number;
  caseResults: Array<{
    caseId: string;
    status: SimulationCaseStatus;
    reason: string;
  }>;
}

export type GovernanceDecision = "pending" | "approved" | "rejected" | "changes_requested";

export interface GovernanceRecord {
  id: string;
  proposalId: string;
  reviewerRole: "process_owner" | "compliance" | "it_operations";
  decision: GovernanceDecision;
  comments: string;
  timestamp: string;
  proposalVersion: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
}

export interface ExecutionRun {
  id: string;
  proposalId: string;
  requestTraceId: string;
  status: "blocked" | "running" | "completed" | "needs_human" | "failed";
  mockToolCalls: Array<{
    tool: string;
    input: string;
    output: string;
  }>;
  auditTrail: string[];
}

export interface LearningRecommendation {
  id: string;
  source: "override" | "failure" | "delay" | "exception";
  recommendation: string;
  expectedImpact: string;
  riskLevel: RiskLevel;
  suggestedProposalChange: string;
}

export interface PolicyRule {
  id: string;
  label: string;
  description: string;
  appliesTo: RequestType[];
  riskLevel: RiskLevel;
  requiresHumanReview: boolean;
  escalationRole: "manager" | "compliance" | "security" | "it_operations" | "procurement" | "finance" | "legal";
}

export interface ApprovalHistoryRecord {
  id: string;
  caseId: string;
  approver: string;
  role: "manager" | "system_owner" | "compliance" | "finance" | "legal" | "procurement";
  decision: "approved" | "rejected" | "requested_changes";
  requestedAt: string;
  decidedAt: string;
  comments: string;
}

export interface DemoFixtureSet {
  rawTraces: RawWorkTrace[];
  policyRules: PolicyRule[];
  approvalHistory: ApprovalHistoryRecord[];
  newIncomingTrace: RawWorkTrace;
}

export interface DemoScenario {
  id: ScenarioId;
  label: string;
  workflowName: string;
  description: string;
  operatorGoal: string;
  graphTitle: string;
  topSystemLabel: string;
  syntheticDataNotice: string;
  requiredOrgData: string[];
  excludedOrgData: string[];
  fixtures: DemoFixtureSet;
}

export interface NormalizationIssue {
  id: string;
  caseId: string;
  severity: "warning" | "error";
  message: string;
}

export interface IngestionSummary {
  rawTraceCount: number;
  normalizedItemCount: number;
  issueCount: number;
  sourceCounts: Record<SourceChannel, number>;
  systemCounts: Record<string, number>;
  departmentCounts: Record<string, number>;
}

export interface IngestionResult {
  items: NormalizedWorkItem[];
  issues: NormalizationIssue[];
  summary: IngestionSummary;
}

export interface FixtureValidationResult {
  valid: boolean;
  errors: string[];
  summary: {
    rawTraceCount: number;
    caseCount: number;
    policyRuleCount: number;
    approvalRecordCount: number;
    channelCounts: Record<SourceChannel, number>;
  };
}
