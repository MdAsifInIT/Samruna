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

const configuredApiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

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

export const DEMO_SESSION_STORAGE_KEY = "samruna.demo-session.v1";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_LONG_RUNNING_TIMEOUT_MS = 30_000;

export interface ApiClientStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ApiClientConfig {
  baseUrl?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
  longRunningTimeoutMs?: number;
  storage?: ApiClientStorage;
  uuid?: () => string;
  signal?: AbortSignal;
}

export function createApiClient(config: ApiClientConfig = {}): WorkspaceApiClient {
  const baseUrl = normalizeBaseUrl(config.baseUrl) ?? configuredApiBaseUrl;
  const fetcher = config.fetcher ?? globalThis.fetch?.bind(globalThis);
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const longRunningTimeoutMs = config.longRunningTimeoutMs ?? DEFAULT_LONG_RUNNING_TIMEOUT_MS;
  const sessionId = getOrCreateSessionId(config.storage ?? resolveSessionStorage(), config.uuid ?? createUuid);

  async function request<T>(
    path: string,
    init?: RequestInit,
    includeSession = true,
    requestTimeoutMs = timeoutMs
  ): Promise<T> {
    if (!fetcher) {
      throw new ApiClientError("fetch_unavailable", "Fetch is not available in this runtime.");
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, requestTimeoutMs);
    const externalSignal = init?.signal ?? config.signal;
    const abortFromCaller = () => controller.abort();
    externalSignal?.addEventListener("abort", abortFromCaller, { once: true });
    if (externalSignal?.aborted) controller.abort();

    try {
      const response = await fetcher(resolveRoute(path, baseUrl), {
        ...init,
        signal: controller.signal,
        headers: {
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...(includeSession ? { "X-Samruna-Session": sessionId } : {}),
          ...init?.headers
        }
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new ApiClientError("invalid_response", "The demo API returned an unsupported response.");
      }

      let payload: ApiResponse<T>;
      try {
        payload = validateEnvelope<T>(await response.json());
      } catch (error) {
        if (error instanceof ApiClientError) throw error;
        if (controller.signal.aborted) throw error;
        throw new ApiClientError("invalid_response", "The demo API returned invalid JSON.");
      }

      if (!payload.ok) {
        throw new ApiClientError(payload.error.code, payload.error.message);
      }

      if (!response.ok) {
        throw new ApiClientError("http_error", `The demo API request failed with status ${response.status}.`);
      }

      return payload.data;
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      if (controller.signal.aborted) {
        throw timedOut
          ? new ApiClientError("request_timeout", `Request timed out after ${requestTimeoutMs}ms.`)
          : new ApiClientError("request_aborted", "Request was aborted.");
      }
      throw new ApiClientError("network_error", "Could not reach the demo API.");
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", abortFromCaller);
    }
  }

  function post<T>(path: string, body?: unknown, requestTimeoutMs = timeoutMs): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body)
    }, true, requestTimeoutMs);
  }

  return {
    getHealth: () => request<HealthResponse>(routes.health, undefined, false),
    getWorkspace: () => request<WorkspaceSnapshot>(routes.workspace),
    selectScenario: (input) => post<WorkspaceSnapshot>(routes.selectScenario, input),
    loadWorkflow: () => post<WorkspaceSnapshot>(routes.load),
    analyzeWorkflow: () => post<WorkspaceSnapshot>(routes.analyze),
    createProposal: (input = {}) => post<WorkspaceSnapshot>(routes.proposals, input, longRunningTimeoutMs),
    selectProposal: (input) => post<WorkspaceSnapshot>(routes.selectProposal, input),
    decideGovernance: (input) => post<WorkspaceSnapshot>(routes.governance, input),
    runApprovedWorkflow: () => post<WorkspaceSnapshot>(routes.run, undefined, longRunningTimeoutMs),
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

function validateEnvelope<T>(value: unknown): ApiResponse<T> {
  if (!value || typeof value !== "object" || !("ok" in value)) {
    throw new ApiClientError("invalid_response", "The demo API returned an invalid response envelope.");
  }
  const candidate = value as { ok?: unknown; data?: unknown; error?: unknown };
  if (candidate.ok === true && "data" in candidate) return candidate as ApiResponse<T>;
  if (candidate.ok === false && candidate.error && typeof candidate.error === "object") {
    const error = candidate.error as { code?: unknown; message?: unknown };
    if (typeof error.code === "string" && typeof error.message === "string") return candidate as ApiResponse<T>;
  }
  throw new ApiClientError("invalid_response", "The demo API returned an invalid response envelope.");
}

function getOrCreateSessionId(storage: ApiClientStorage | undefined, uuid: () => string): string {
  try {
    const existing = storage?.getItem(DEMO_SESSION_STORAGE_KEY);
    if (existing && isUuid(existing)) return existing;
    const created = uuid();
    if (!isUuid(created)) throw new ApiClientError("invalid_demo_session", "Could not create a valid demo session.");
    storage?.setItem(DEMO_SESSION_STORAGE_KEY, created);
    return created;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    const created = uuid();
    if (!isUuid(created)) throw new ApiClientError("invalid_demo_session", "Could not create a valid demo session.");
    return created;
  }
}

function resolveSessionStorage(): ApiClientStorage | undefined {
  return typeof window === "undefined" ? undefined : window.sessionStorage;
}

function createUuid(): string {
  return globalThis.crypto.randomUUID();
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeBaseUrl(baseUrl?: string): string | undefined {
  const trimmed = baseUrl?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}
