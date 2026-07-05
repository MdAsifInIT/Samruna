import type {
  AuditEvent,
  AutomationProposal,
  ExecutionRun,
  GovernanceDecision,
  GovernanceRecord,
  LearningRecommendation,
  ScenarioId,
  SimulationResult,
  WorkGraph
} from "./types";

export const DEMO_STORAGE_KEY = "work-graph-foundry.demo-state.v1";
export const DEMO_STATE_VERSION = 1;

export type AiProviderMode = "mock" | "openai";
export type AiInvocationStatus = "succeeded" | "fallback";
export type AiValidationStatus = "validated" | "not_applicable" | "failed";

export interface AiInvocationMetadata {
  providerMode: AiProviderMode;
  providerLabel: string;
  model?: string;
  status: AiInvocationStatus;
  validationStatus: AiValidationStatus;
  requestedAt: string;
  completedAt: string;
  fallbackReason?: string;
  errorCode?: string;
}

export interface AiProviderSnapshot {
  mode: AiProviderMode;
  label: string;
  available: boolean;
  model?: string;
  lastInvocation?: AiInvocationMetadata;
}

export interface DemoStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface PersistedDemoState {
  version: typeof DEMO_STATE_VERSION;
  selectedScenarioId: ScenarioId;
  sampleLoaded: boolean;
  analysisRequested: boolean;
  proposalRequested: boolean;
  selectedProposalId?: string;
  governanceDecision: GovernanceDecision;
  runRequested: boolean;
  graph?: WorkGraph;
  proposals: AutomationProposal[];
  governanceRecords: GovernanceRecord[];
  simulation?: SimulationResult;
  executionRuns: ExecutionRun[];
  recommendations: LearningRecommendation[];
  auditEvents: AuditEvent[];
  aiProvider: AiProviderSnapshot;
  updatedAt: string;
}

export interface RunSummaryExport {
  exportedAt: string;
  scenarioId: ScenarioId;
  state: PersistedDemoState;
}

export function createSeedDemoState(
  selectedScenarioId: ScenarioId = "it-access",
  timestamp = "2026-05-16T09:00:00Z"
): PersistedDemoState {
  return {
    version: DEMO_STATE_VERSION,
    selectedScenarioId,
    sampleLoaded: false,
    analysisRequested: false,
    proposalRequested: false,
    governanceDecision: "pending",
    runRequested: false,
    proposals: [],
    governanceRecords: [],
    executionRuns: [],
    recommendations: [],
    auditEvents: [],
    aiProvider: createMockAiProviderSnapshot(),
    updatedAt: timestamp
  };
}

export function createMockAiProviderSnapshot(lastInvocation?: AiInvocationMetadata): AiProviderSnapshot {
  return {
    mode: "mock",
    label: "Historical validation engine",
    available: true,
    model: "validation-planner",
    lastInvocation
  };
}

export function loadPersistedDemoState(storage = resolveDemoStorage()): PersistedDemoState | undefined {
  if (!storage) {
    return undefined;
  }

  try {
    const raw = storage.getItem(DEMO_STORAGE_KEY);

    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as unknown;

    return normalizePersistedDemoState(parsed);
  } catch {
    return undefined;
  }
}

export function saveDemoState(state: PersistedDemoState, storage = resolveDemoStorage()): void {
  if (!storage) {
    return;
  }

  storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}

export function resetPersistedDemoState(
  selectedScenarioId: ScenarioId = "it-access",
  storage = resolveDemoStorage()
): PersistedDemoState {
  const seed = createSeedDemoState(selectedScenarioId);

  if (storage) {
    storage.removeItem(DEMO_STORAGE_KEY);
    saveDemoState(seed, storage);
  }

  return seed;
}

export function exportRunSummary(state: PersistedDemoState, timestamp = new Date().toISOString()): string {
  const summary: RunSummaryExport = {
    exportedAt: timestamp,
    scenarioId: state.selectedScenarioId,
    state
  };

  return JSON.stringify(summary, null, 2);
}

export function importRunSummary(raw: string): PersistedDemoState {
  const parsed = JSON.parse(raw) as unknown;

  if (isRunSummaryExport(parsed)) {
    return normalizePersistedDemoState(parsed.state) ?? parsed.state;
  }

  const state = normalizePersistedDemoState(parsed);

  if (state) {
    return state;
  }

  throw new Error("Imported execution summary did not match the workflow state contract");
}

function resolveDemoStorage(): DemoStorage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}

function isRunSummaryExport(value: unknown): value is RunSummaryExport {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RunSummaryExport>;

  return (
    typeof candidate.exportedAt === "string" &&
    (candidate.scenarioId === "it-access" || candidate.scenarioId === "procurement-intake") &&
    Boolean(normalizePersistedDemoState(candidate.state))
  );
}

function normalizePersistedDemoState(value: unknown): PersistedDemoState | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const state = value as Partial<PersistedDemoState>;

  const valid =
    state.version === DEMO_STATE_VERSION &&
    (state.selectedScenarioId === "it-access" || state.selectedScenarioId === "procurement-intake") &&
    typeof state.sampleLoaded === "boolean" &&
    typeof state.analysisRequested === "boolean" &&
    typeof state.proposalRequested === "boolean" &&
    isGovernanceDecision(state.governanceDecision) &&
    typeof state.runRequested === "boolean" &&
    Array.isArray(state.proposals) &&
    state.proposals.every(isAutomationProposal) &&
    Array.isArray(state.governanceRecords) &&
    state.governanceRecords.every(isGovernanceRecord) &&
    Array.isArray(state.executionRuns) &&
    state.executionRuns.every(isExecutionRun) &&
    Array.isArray(state.recommendations) &&
    state.recommendations.every(isLearningRecommendation) &&
    Array.isArray(state.auditEvents) &&
    state.auditEvents.every(isAuditEvent) &&
    typeof state.updatedAt === "string" &&
    (state.graph === undefined || isWorkGraph(state.graph)) &&
    (state.simulation === undefined || isSimulationResult(state.simulation)) &&
    (state.aiProvider === undefined || isAiProviderSnapshot(state.aiProvider));

  if (!valid) {
    return undefined;
  }

  const proposals = state.proposals ?? [];
  const selectedProposalId =
    typeof state.selectedProposalId === "string" && proposals.some((proposal) => proposal.id === state.selectedProposalId)
      ? state.selectedProposalId
      : proposals.at(-1)?.id;

  return {
    ...state,
    selectedProposalId,
    aiProvider: state.aiProvider ?? createMockAiProviderSnapshot()
  } as PersistedDemoState;
}

function isGovernanceDecision(value: unknown): value is GovernanceDecision {
  return value === "pending" || value === "approved" || value === "rejected" || value === "changes_requested";
}

function isAutomationProposal(value: unknown): value is AutomationProposal {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.patternId) &&
    isNonEmptyString(value.trigger) &&
    isStringArray(value.requiredData) &&
    isStringArray(value.eligibilityRules) &&
    isStringArray(value.policyChecks) &&
    isStringArray(value.actions) &&
    isStringArray(value.escalations) &&
    isNumber(value.confidence) &&
    isRiskLevel(value.riskLevel) &&
    isNonEmptyString(value.expectedValue) &&
    isNonEmptyString(value.auditRationale) &&
    isPositiveInteger(value.version) &&
    (value.changeSummary === undefined || typeof value.changeSummary === "string") &&
    (value.generatedAt === undefined || typeof value.generatedAt === "string")
  );
}

function isGovernanceRecord(value: unknown): value is GovernanceRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.proposalId) &&
    (value.reviewerRole === "process_owner" || value.reviewerRole === "compliance" || value.reviewerRole === "it_operations") &&
    isGovernanceDecision(value.decision) &&
    typeof value.comments === "string" &&
    isNonEmptyString(value.timestamp) &&
    isPositiveInteger(value.proposalVersion)
  );
}

function isExecutionRun(value: unknown): value is ExecutionRun {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.proposalId) &&
    isNonEmptyString(value.requestTraceId) &&
    (value.status === "blocked" ||
      value.status === "running" ||
      value.status === "completed" ||
      value.status === "needs_human" ||
      value.status === "failed") &&
    Array.isArray(value.mockToolCalls) &&
    value.mockToolCalls.every(isMockToolCall) &&
    isStringArray(value.auditTrail)
  );
}

function isLearningRecommendation(value: unknown): value is LearningRecommendation {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    (value.source === "override" || value.source === "failure" || value.source === "delay" || value.source === "exception") &&
    isNonEmptyString(value.recommendation) &&
    isNonEmptyString(value.expectedImpact) &&
    isRiskLevel(value.riskLevel) &&
    isNonEmptyString(value.suggestedProposalChange)
  );
}

function isAuditEvent(value: unknown): value is AuditEvent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.timestamp) &&
    isNonEmptyString(value.actor) &&
    isNonEmptyString(value.action) &&
    isNonEmptyString(value.detail)
  );
}

function isAiProviderSnapshot(value: unknown): value is AiProviderSnapshot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.mode === "mock" || value.mode === "openai") &&
    isNonEmptyString(value.label) &&
    typeof value.available === "boolean" &&
    (value.model === undefined || typeof value.model === "string") &&
    (value.lastInvocation === undefined || isAiInvocationMetadata(value.lastInvocation))
  );
}

function isAiInvocationMetadata(value: unknown): value is AiInvocationMetadata {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.providerMode === "mock" || value.providerMode === "openai") &&
    isNonEmptyString(value.providerLabel) &&
    (value.model === undefined || typeof value.model === "string") &&
    (value.status === "succeeded" || value.status === "fallback") &&
    (value.validationStatus === "validated" ||
      value.validationStatus === "not_applicable" ||
      value.validationStatus === "failed") &&
    isNonEmptyString(value.requestedAt) &&
    isNonEmptyString(value.completedAt) &&
    (value.fallbackReason === undefined || typeof value.fallbackReason === "string") &&
    (value.errorCode === undefined || typeof value.errorCode === "string")
  );
}

function isWorkGraph(value: unknown): value is WorkGraph {
  if (!isRecord(value) || !isRecord(value.metrics)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.patternId) &&
    Array.isArray(value.nodes) &&
    value.nodes.every(isGraphNode) &&
    Array.isArray(value.edges) &&
    value.edges.every(isGraphEdge) &&
    isNumber(value.metrics.averageCycleTimeHours) &&
    isNumber(value.metrics.exceptionRate) &&
    isNumber(value.metrics.approvalDelayHours)
  );
}

function isSimulationResult(value: unknown): value is SimulationResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.proposalId) &&
    isNumber(value.totalCases) &&
    isNumber(value.passed) &&
    isNumber(value.failed) &&
    isNumber(value.needsHuman) &&
    isNumber(value.policyRisk) &&
    isNumber(value.avoidedDelayHours) &&
    Array.isArray(value.caseResults) &&
    value.caseResults.every(isSimulationCaseResult)
  );
}

function isGraphNode(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    (value.kind === "actor" ||
      value.kind === "approval" ||
      value.kind === "policy" ||
      value.kind === "system" ||
      value.kind === "action" ||
      value.kind === "exception" ||
      value.kind === "outcome") &&
    isNonEmptyString(value.label) &&
    isNumber(value.count) &&
    isRiskLevel(value.riskLevel)
  );
}

function isGraphEdge(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.source) &&
    isNonEmptyString(value.target) &&
    isNonEmptyString(value.label) &&
    isNumber(value.count) &&
    isNumber(value.averageDurationHours) &&
    isNumber(value.exceptionRate)
  );
}

function isSimulationCaseResult(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.caseId) &&
    (value.status === "pass" || value.status === "fail" || value.status === "needs_human" || value.status === "policy_risk") &&
    isNonEmptyString(value.reason)
  );
}

function isMockToolCall(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return isNonEmptyString(value.tool) && isNonEmptyString(value.input) && isNonEmptyString(value.output);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isRiskLevel(value: unknown): value is "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high";
}
