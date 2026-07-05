import type {
  ApiResponse,
  GovernanceDecisionRequest,
  ProposalCreateRequest,
  ProposalSelectRequest,
  ScenarioSelectionRequest,
  HealthResponse,
  WorkspaceImportRequest,
  WorkspaceResetRequest,
  WorkspaceSnapshot
} from "../domain/api";
import { API_BASE_PATH as DEFAULT_API_BASE_PATH, workspaceRoutes as routes } from "../domain/api";

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export interface WorkspaceApiClient {
  getHealth(): Promise<HealthResponse>;
  getWorkspace(): Promise<WorkspaceSnapshot>;
  selectScenario(input: ScenarioSelectionRequest): Promise<WorkspaceSnapshot>;
  loadWorkflow(): Promise<WorkspaceSnapshot>;
  analyzeWorkflow(): Promise<WorkspaceSnapshot>;
  createProposal(input?: ProposalCreateRequest): Promise<WorkspaceSnapshot>;
  selectProposal(input: ProposalSelectRequest): Promise<WorkspaceSnapshot>;
  decideGovernance(input: GovernanceDecisionRequest): Promise<WorkspaceSnapshot>;
  runApprovedWorkflow(): Promise<WorkspaceSnapshot>;
  resetWorkspace(input?: WorkspaceResetRequest): Promise<WorkspaceSnapshot>;
  exportWorkspace(): Promise<string>;
  importWorkspace(input: WorkspaceImportRequest): Promise<WorkspaceSnapshot>;
}

export function createApiClient(config: { baseUrl?: string; fetcher?: typeof fetch } = {}): WorkspaceApiClient {
  const baseUrl = config.baseUrl;
  const fetcher = config.fetcher ?? globalThis.fetch?.bind(globalThis);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!fetcher) {
      throw new ApiClientError("fetch_unavailable", "Fetch is not available in this runtime.");
    }

    const response = await fetcher(resolveRoute(path, baseUrl), {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers
      }
    });
    const payload = (await response.json()) as ApiResponse<T>;

    if (!payload.ok) {
      throw new ApiClientError(payload.error.code, payload.error.message);
    }

    return payload.data;
  }

  function post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  return {
    getHealth: () => request<HealthResponse>(routes.health),
    getWorkspace: () => request<WorkspaceSnapshot>(routes.workspace),
    selectScenario: (input) => post<WorkspaceSnapshot>(routes.selectScenario, input),
    loadWorkflow: () => post<WorkspaceSnapshot>(routes.load),
    analyzeWorkflow: () => post<WorkspaceSnapshot>(routes.analyze),
    createProposal: (input = {}) => post<WorkspaceSnapshot>(routes.proposals, input),
    selectProposal: (input) => post<WorkspaceSnapshot>(routes.selectProposal, input),
    decideGovernance: (input) => post<WorkspaceSnapshot>(routes.governance, input),
    runApprovedWorkflow: () => post<WorkspaceSnapshot>(routes.run),
    resetWorkspace: (input = {}) => post<WorkspaceSnapshot>(routes.reset, input),
    exportWorkspace: () => request<string>(routes.export),
    importWorkspace: (input) => post<WorkspaceSnapshot>(routes.import, input)
  };
}

function resolveRoute(path: string, baseUrl?: string): string {
  if (!baseUrl) {
    return path;
  }

  return path.startsWith(DEFAULT_API_BASE_PATH)
    ? `${baseUrl}${path.slice(DEFAULT_API_BASE_PATH.length)}`
    : `${baseUrl}${path}`;
}
