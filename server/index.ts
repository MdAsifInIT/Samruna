import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { isIP } from "node:net";
import { extname, isAbsolute, join, normalize, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type {
  ApiResponse,
  GovernanceDecisionRequest,
  ProposalCreateRequest,
  ProposalSelectRequest,
  ScenarioSelectionRequest,
  WorkspaceImportRequest,
  WorkspaceResetRequest
} from "../src/domain/api";
import { workspaceRoutes } from "../src/domain/api";
import { listDemoScenarios } from "../src/domain/fixtures";
import type { GovernanceDecision, ScenarioId } from "../src/domain/types";
import { createServerAiProvider } from "./ai";
import { createWorkspaceService, WorkspaceError, type WorkspaceService } from "./workspace";

const DEFAULT_PORT = 8787;
const DEFAULT_ALLOWED_ORIGINS = [
  "https://mdasifinit.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:4174",
  "http://127.0.0.1:4174",
  "http://localhost:8787",
  "http://127.0.0.1:8787"
];

const port = readNumberArg("--port") ?? Number(process.env.PORT ?? DEFAULT_PORT);
const host = process.env.HOST ?? (process.env.RENDER ? "0.0.0.0" : "127.0.0.1");
const serveStatic = process.argv.includes("--serve-static") || process.env.SAMRUNA_SERVE_STATIC === "1";
const staticRoot = resolve(process.cwd(), "dist");
const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGINS);

const scenarioIds = new Set(listDemoScenarios().map((scenario) => scenario.id));
const governanceDecisions = new Set<GovernanceDecision>(["approved", "rejected", "changes_requested"]);
const DEMO_SESSION_HEADER = "x-samruna-session";
const MAX_FORWARDED_FOR_LENGTH = 256;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WORKSPACE_PATHS = new Set<string>(
  Object.values(workspaceRoutes).filter((path) => path !== workspaceRoutes.health && path !== workspaceRoutes.scenarios)
);

export interface AppOptions {
  now?: () => number;
  trustedProxy?: boolean;
  limits?: Partial<RateLimitConfig>;
}

export interface RateLimitConfig {
  generalPerMinute: number;
  mutationsPerMinute: number;
  expensivePerTenMinutesPerSession: number;
  expensivePerTenMinutesPerIp: number;
}

const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  generalPerMinute: 120,
  mutationsPerMinute: 60,
  expensivePerTenMinutesPerSession: 10,
  expensivePerTenMinutesPerIp: 30
};

export function readRateLimits(env: NodeJS.ProcessEnv = process.env): RateLimitConfig {
  return {
    generalPerMinute: readPositiveInteger(env.SAMRUNA_RATE_LIMIT_GENERAL_PER_MINUTE) ?? DEFAULT_RATE_LIMITS.generalPerMinute,
    mutationsPerMinute:
      readPositiveInteger(env.SAMRUNA_RATE_LIMIT_MUTATIONS_PER_MINUTE) ?? DEFAULT_RATE_LIMITS.mutationsPerMinute,
    expensivePerTenMinutesPerSession:
      readPositiveInteger(env.SAMRUNA_RATE_LIMIT_EXPENSIVE_SESSION_PER_10_MINUTES) ??
      DEFAULT_RATE_LIMITS.expensivePerTenMinutesPerSession,
    expensivePerTenMinutesPerIp:
      readPositiveInteger(env.SAMRUNA_RATE_LIMIT_EXPENSIVE_IP_PER_10_MINUTES) ??
      DEFAULT_RATE_LIMITS.expensivePerTenMinutesPerIp
  };
}

export function createApp(workspaceService: WorkspaceService, options: AppOptions = {}) {
  const now = options.now ?? Date.now;
  const limiter = new FixedWindowRateLimiter(now);
  const limits = { ...readRateLimits(), ...options.limits };
  const trustedProxy = options.trustedProxy ?? Boolean(process.env.RENDER || process.env.SAMRUNA_TRUST_PROXY === "1");
  workspaceService.purgeExpiredSessions();
  const expiryCleanup = setInterval(() => workspaceService.purgeExpiredSessions(), 15 * 60 * 1000);
  const limiterCleanup = setInterval(() => limiter.cleanup(), 5 * 60 * 1000);
  unrefTimer(expiryCleanup);
  unrefTimer(limiterCleanup);

  const server = createServer(async (request, response) => {
    try {
      await routeRequest(request, response, workspaceService, limiter, limits, trustedProxy);
    } catch (error) {
      const status = error instanceof WorkspaceError ? 400 : 500;
      const code = error instanceof WorkspaceError ? error.code : "internal_error";
      const message = error instanceof Error ? error.message : "Unexpected server error";

      sendJson(response, status, {
        ok: false,
        error: {
          code,
          message
        }
      });
    }
  });

  server.once("close", () => {
    clearInterval(expiryCleanup);
    clearInterval(limiterCleanup);
  });

  return server;
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  workspaceService: WorkspaceService,
  limiter: FixedWindowRateLimiter,
  limits: RateLimitConfig,
  trustedProxy: boolean
): Promise<void> {
  if (!applyCors(request, response)) {
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (url.pathname.startsWith("/api/")) {
    await routeApi(request, response, url.pathname, workspaceService, limiter, limits, trustedProxy);
    return;
  }

  if (serveStatic) {
    serveStaticAsset(url.pathname, response);
    return;
  }

  sendJson(response, 404, {
    ok: false,
    error: {
      code: "not_found",
      message: "Route not found"
    }
  });
}

async function routeApi(
  request: IncomingMessage,
  response: ServerResponse,
  path: string,
  workspaceService: WorkspaceService,
  limiter: FixedWindowRateLimiter,
  limits: RateLimitConfig,
  trustedProxy: boolean
): Promise<void> {
  const method = request.method ?? "GET";

  if (method === "GET" && path === workspaceRoutes.health) {
    sendOk(response, workspaceService.health());
    return;
  }

  const ip = clientIp(request, trustedProxy);
  if (!consumeLimit(response, limiter, `general:${ip}`, limits.generalPerMinute, 60_000)) {
    return;
  }

  if (method === "GET" && path === workspaceRoutes.scenarios) {
    sendOk(response, workspaceService.scenarios());
    return;
  }

  if (!WORKSPACE_PATHS.has(path)) {
    sendJson(response, 404, {
      ok: false,
      error: { code: "not_found", message: "API route not found" }
    });
    return;
  }

  const sessionId = request.headers[DEMO_SESSION_HEADER];
  if (typeof sessionId !== "string" || !UUID_PATTERN.test(sessionId)) {
    throw new WorkspaceError("invalid_demo_session", "A valid X-Samruna-Session UUID header is required.");
  }
  const scopedService = workspaceService.forWorkspace(sessionId);

  if (method === "POST" && !consumeLimit(response, limiter, `mutation:${sessionId}`, limits.mutationsPerMinute, 60_000)) {
    return;
  }

  if (method === "POST" && (path === workspaceRoutes.proposals || path === workspaceRoutes.run)) {
    if (!consumeLimit(response, limiter, `expensive-session:${sessionId}`, limits.expensivePerTenMinutesPerSession, 600_000)) {
      return;
    }
    if (!consumeLimit(response, limiter, `expensive-ip:${ip}`, limits.expensivePerTenMinutesPerIp, 600_000)) {
      return;
    }
  }

  if (method === "GET" && path === workspaceRoutes.workspace) {
    sendOk(response, scopedService.snapshot());
    return;
  }

  if (method === "POST" && path === workspaceRoutes.selectScenario) {
    sendOk(response, scopedService.selectScenario(await readScenarioSelection(request)));
    return;
  }

  if (method === "POST" && path === workspaceRoutes.load) {
    sendOk(response, scopedService.load());
    return;
  }

  if (method === "POST" && path === workspaceRoutes.analyze) {
    sendOk(response, scopedService.analyze());
    return;
  }

  if (method === "POST" && path === workspaceRoutes.proposals) {
    sendOk(response, await scopedService.createProposal(await readProposalCreate(request)));
    return;
  }

  if (method === "POST" && path === workspaceRoutes.selectProposal) {
    sendOk(response, scopedService.selectProposal(await readProposalSelect(request)));
    return;
  }

  if (method === "POST" && path === workspaceRoutes.governance) {
    sendOk(response, scopedService.decideGovernance(await readGovernanceDecision(request)));
    return;
  }

  if (method === "POST" && path === workspaceRoutes.run) {
    sendOk(response, await scopedService.run());
    return;
  }

  if (method === "POST" && path === workspaceRoutes.reset) {
    sendOk(response, scopedService.reset(await readWorkspaceReset(request)));
    return;
  }

  if (method === "GET" && path === workspaceRoutes.export) {
    sendOk(response, scopedService.export());
    return;
  }

  if (method === "POST" && path === workspaceRoutes.import) {
    sendOk(response, scopedService.import(await readWorkspaceImport(request)));
    return;
  }

  if (method === "GET" && path === workspaceRoutes.audit) {
    sendOk(response, scopedService.audit());
    return;
  }

  sendJson(response, 404, {
    ok: false,
    error: {
      code: "not_found",
      message: "API route not found"
    }
  });
}

function sendOk<T>(response: ServerResponse, data: T): void {
  sendJson(response, 200, { ok: true, data });
}

function sendJson<T>(response: ServerResponse, status: number, payload: ApiResponse<T>): void {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly now: () => number) {}

  consume(key: string, limit: number, windowMs: number): RateLimitResult {
    const currentTime = this.now();
    let bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= currentTime) {
      bucket = { count: 0, resetAt: currentTime + windowMs };
      this.buckets.set(key, bucket);
    }

    const allowed = bucket.count < limit;
    if (allowed) {
      bucket.count += 1;
    }

    return {
      allowed,
      limit,
      remaining: Math.max(0, limit - bucket.count),
      resetAt: Math.ceil(bucket.resetAt / 1000),
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000))
    };
  }

  cleanup(): void {
    const currentTime = this.now();
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= currentTime) {
        this.buckets.delete(key);
      }
    }
  }
}

function consumeLimit(
  response: ServerResponse,
  limiter: FixedWindowRateLimiter,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const result = limiter.consume(key, limit, windowMs);
  response.setHeader("RateLimit-Limit", String(result.limit));
  response.setHeader("RateLimit-Remaining", String(result.remaining));
  response.setHeader("RateLimit-Reset", String(result.resetAt));

  if (result.allowed) {
    return true;
  }

  response.setHeader("Retry-After", String(result.retryAfter));
  sendJson(response, 429, {
    ok: false,
    error: {
      code: "rate_limited",
      message: "Too many demo requests. Retry after the current rate-limit window."
    }
  });
  return false;
}

function clientIp(request: IncomingMessage, trustedProxy: boolean): string {
  if (trustedProxy) {
    const forwarded = request.headers["x-forwarded-for"];
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const first = raw && raw.length <= MAX_FORWARDED_FOR_LENGTH ? raw.split(",")[0]?.trim() : undefined;
    if (first && isIP(first)) {
      return first;
    }
  }

  return request.socket.remoteAddress ?? "unknown";
}

async function readJsonBody<T>(request: IncomingMessage, fallback?: T): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();

  if (!raw) {
    if (fallback !== undefined) {
      return fallback;
    }

    throw new WorkspaceError("invalid_request", "Expected a JSON request body.");
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new WorkspaceError("invalid_json", "Request body must be valid JSON.");
  }
}

async function readScenarioSelection(request: IncomingMessage): Promise<ScenarioSelectionRequest> {
  const body = await readJsonObject(request);
  const scenarioId = requireString(body, "scenarioId", "invalid_scenario");

  if (!isScenarioId(scenarioId)) {
    throw new WorkspaceError("invalid_scenario", `Unknown scenarioId: ${scenarioId}`);
  }

  return { scenarioId };
}

async function readProposalCreate(request: IncomingMessage): Promise<ProposalCreateRequest> {
  const body = await readJsonObject(request, {});
  const changeSummary = optionalString(body, "changeSummary", "invalid_change_summary");

  return changeSummary === undefined ? {} : { changeSummary };
}

async function readProposalSelect(request: IncomingMessage): Promise<ProposalSelectRequest> {
  const body = await readJsonObject(request);

  return {
    proposalId: requireString(body, "proposalId", "invalid_proposal_id")
  };
}

async function readGovernanceDecision(request: IncomingMessage): Promise<GovernanceDecisionRequest> {
  const body = await readJsonObject(request);
  const decision = requireString(body, "decision", "invalid_governance_decision");

  if (!governanceDecisions.has(decision as GovernanceDecision)) {
    throw new WorkspaceError("invalid_governance_decision", `Unsupported governance decision: ${decision}`);
  }

  return {
    decision: decision as GovernanceDecisionRequest["decision"],
    comments: optionalString(body, "comments", "invalid_comments")
  };
}

async function readWorkspaceReset(request: IncomingMessage): Promise<WorkspaceResetRequest> {
  const body = await readJsonObject(request, {});
  const scenarioId = optionalString(body, "scenarioId", "invalid_scenario");

  if (scenarioId !== undefined && !isScenarioId(scenarioId)) {
    throw new WorkspaceError("invalid_scenario", `Unknown scenarioId: ${scenarioId}`);
  }

  return scenarioId === undefined ? {} : { scenarioId };
}

async function readWorkspaceImport(request: IncomingMessage): Promise<WorkspaceImportRequest> {
  const body = await readJsonObject(request);

  if (!("summary" in body)) {
    throw new WorkspaceError("invalid_import", "Import request requires a summary field.");
  }

  const summary = body.summary;

  if (typeof summary !== "string" && !isRecord(summary)) {
    throw new WorkspaceError("invalid_import", "Import summary must be a JSON string or object.");
  }

  return { summary: summary as WorkspaceImportRequest["summary"] };
}

async function readJsonObject(request: IncomingMessage, fallback?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const body = await readJsonBody<unknown>(request, fallback);

  if (!isRecord(body)) {
    throw new WorkspaceError("invalid_request", "Request body must be a JSON object.");
  }

  return body;
}

function requireString(body: Record<string, unknown>, key: string, code: string): string {
  const value = body[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new WorkspaceError(code, `Request field ${key} must be a non-empty string.`);
  }

  return value;
}

function optionalString(body: Record<string, unknown>, key: string, code: string): string | undefined {
  const value = body[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new WorkspaceError(code, `Request field ${key} must be a string.`);
  }

  return value;
}

function isScenarioId(value: string): value is ScenarioId {
  return scenarioIds.has(value as ScenarioId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function serveStaticAsset(pathname: string, response: ServerResponse): void {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const resolved = resolve(staticRoot, `.${normalize(decodeURIComponent(requested))}`);
  const target = isWithinStaticRoot(resolved) && existsSync(resolved) && statSync(resolved).isFile()
    ? resolved
    : join(staticRoot, "index.html");

  if (!existsSync(target)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Build artifact not found. Run npm run build first.");
    return;
  }

  response.writeHead(200, { "Content-Type": contentTypeFor(target) });
  createReadStream(target).pipe(response);
}

function applyCors(request: IncomingMessage, response: ServerResponse): boolean {
  const origin = request.headers.origin;

  if (origin) {
    if (!allowedOrigins.has(origin)) {
      sendCorsForbidden(response);
      return false;
    }

    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Samruna-Session");
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return false;
  }

  return true;
}

function sendCorsForbidden(response: ServerResponse): void {
  sendJson(response, 403, {
    ok: false,
    error: {
      code: "cors_forbidden",
      message: "Origin is not allowed by this API."
    }
  });
}

function isWithinStaticRoot(pathname: string): boolean {
  const child = relative(staticRoot, pathname);

  return child === "" || (!child.startsWith("..") && !isAbsolute(child));
}

function contentTypeFor(pathname: string): string {
  switch (extname(pathname)) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".html":
    default:
      return "text/html; charset=utf-8";
  }
}

function readNumberArg(name: string): number | undefined {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;

  return value ? Number(value) : undefined;
}

function readPositiveInteger(raw: string | undefined): number | undefined {
  if (!raw || !/^\d+$/.test(raw)) {
    return undefined;
  }

  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function unrefTimer(handle: ReturnType<typeof setInterval>): void {
  const candidate = handle as unknown as { unref?: () => void };
  if (typeof candidate.unref === "function") {
    candidate.unref();
  }
}

function parseAllowedOrigins(raw: string | undefined): Set<string> {
  const configured = raw
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const service = createWorkspaceService(undefined, createServerAiProvider());
  const server = createApp(service);

  server.listen(port, host, () => {
    console.log(`Samruna backend listening at http://${host}:${port}`);
  });

  const shutdown = () => {
    server.close(() => {
      service.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
