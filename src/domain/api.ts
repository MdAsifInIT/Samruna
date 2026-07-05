import type { AiProviderSnapshot, PersistedDemoState, RunSummaryExport } from "./persistence";
import type {
  AuditEvent,
  AutomationProposal,
  DemoScenario,
  FixtureValidationResult,
  GovernanceDecision,
  GovernanceRecord,
  IngestionResult,
  LearningRecommendation,
  PatternDetectionResult,
  ScenarioId,
  SimulationResult,
  WorkGraph
} from "./types";

export const API_BASE_PATH = "/api";

export interface ApiError {
  code: string;
  message: string;
}

export type ApiResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ApiError;
    };

export interface HealthResponse {
  status: "ok";
  databaseReady: boolean;
  organizationId: string;
  aiProvider: AiProviderSnapshot;
}

export interface DemoOrganization {
  id: string;
  name: string;
  description: string;
  syntheticDataNotice: string;
  scenarioIds: ScenarioId[];
}

export type WorkflowStageState = "complete" | "current" | "available" | "locked";

export interface WorkflowStageSnapshot {
  id:
    | "load-scenario"
    | "analyze-workflow"
    | "inspect-graph"
    | "generate-proposal"
    | "review-governance"
    | "approve-reject"
    | "run-mock"
    | "review-audit";
  index: number;
  label: string;
  detail: string;
  state: WorkflowStageState;
}

export interface WorkspaceSnapshot {
  organization: DemoOrganization;
  state: PersistedDemoState;
  scenario: DemoScenario;
  scenarios: DemoScenario[];
  validation: FixtureValidationResult;
  ingestion?: IngestionResult;
  patternDetection?: PatternDetectionResult;
  graph?: WorkGraph;
  proposal?: AutomationProposal;
  proposalVersions: AutomationProposal[];
  simulation?: SimulationResult;
  governanceRecords: GovernanceRecord[];
  executionRun?: PersistedDemoState["executionRuns"][number];
  learningRecommendation?: LearningRecommendation;
  auditEvents: AuditEvent[];
  aiProvider: AiProviderSnapshot;
  executionReady: boolean;
  executionGateLabel: string;
  executionGateCopy: string;
  workflowStages: WorkflowStageSnapshot[];
}

export interface ScenarioSelectionRequest {
  scenarioId: ScenarioId;
}

export interface GovernanceDecisionRequest {
  decision: Exclude<GovernanceDecision, "pending">;
  comments?: string;
}

export interface ProposalCreateRequest {
  changeSummary?: string;
}

export interface ProposalSelectRequest {
  proposalId: string;
}

export interface WorkspaceResetRequest {
  scenarioId?: ScenarioId;
}

export interface WorkspaceImportRequest {
  summary: string | RunSummaryExport | PersistedDemoState;
}

export const workspaceRoutes = {
  health: `${API_BASE_PATH}/health`,
  workspace: `${API_BASE_PATH}/workspace`,
  scenarios: `${API_BASE_PATH}/scenarios`,
  selectScenario: `${API_BASE_PATH}/workspace/scenario`,
  load: `${API_BASE_PATH}/workspace/load`,
  analyze: `${API_BASE_PATH}/workspace/analyze`,
  proposals: `${API_BASE_PATH}/workspace/proposals`,
  selectProposal: `${API_BASE_PATH}/workspace/proposals/select`,
  governance: `${API_BASE_PATH}/workspace/governance`,
  run: `${API_BASE_PATH}/workspace/run`,
  reset: `${API_BASE_PATH}/workspace/reset`,
  export: `${API_BASE_PATH}/workspace/export`,
  import: `${API_BASE_PATH}/workspace/import`,
  audit: `${API_BASE_PATH}/workspace/audit`
} as const;
