import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
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

const port = readNumberArg("--port") ?? Number(process.env.PORT ?? DEFAULT_PORT);
const serveStatic = process.argv.includes("--serve-static") || process.env.WGF_SERVE_STATIC === "1";
const staticRoot = resolve(process.cwd(), "dist");

const scenarioIds = new Set(listDemoScenarios().map((scenario) => scenario.id));
const governanceDecisions = new Set<GovernanceDecision>(["approved", "rejected", "changes_requested"]);

export function createApp(workspaceService: WorkspaceService) {
  return createServer(async (request, response) => {
    try {
      await routeRequest(request, response, workspaceService);
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
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  workspaceService: WorkspaceService
): Promise<void> {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (url.pathname.startsWith("/api/")) {
    await routeApi(request, response, url.pathname, workspaceService);
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
  workspaceService: WorkspaceService
): Promise<void> {
  const method = request.method ?? "GET";

  if (method === "GET" && path === workspaceRoutes.health) {
    sendOk(response, workspaceService.health());
    return;
  }

  if (method === "GET" && path === workspaceRoutes.scenarios) {
    sendOk(response, workspaceService.scenarios());
    return;
  }

  if (method === "GET" && path === workspaceRoutes.workspace) {
    sendOk(response, workspaceService.snapshot());
    return;
  }

  if (method === "POST" && path === workspaceRoutes.selectScenario) {
    sendOk(response, workspaceService.selectScenario(await readScenarioSelection(request)));
    return;
  }

  if (method === "POST" && path === workspaceRoutes.load) {
    sendOk(response, workspaceService.load());
    return;
  }

  if (method === "POST" && path === workspaceRoutes.analyze) {
    sendOk(response, workspaceService.analyze());
    return;
  }

  if (method === "POST" && path === workspaceRoutes.proposals) {
    sendOk(response, await workspaceService.createProposal(await readProposalCreate(request)));
    return;
  }

  if (method === "POST" && path === workspaceRoutes.selectProposal) {
    sendOk(response, workspaceService.selectProposal(await readProposalSelect(request)));
    return;
  }

  if (method === "POST" && path === workspaceRoutes.governance) {
    sendOk(response, workspaceService.decideGovernance(await readGovernanceDecision(request)));
    return;
  }

  if (method === "POST" && path === workspaceRoutes.run) {
    sendOk(response, workspaceService.run());
    return;
  }

  if (method === "POST" && path === workspaceRoutes.reset) {
    sendOk(response, workspaceService.reset(await readWorkspaceReset(request)));
    return;
  }

  if (method === "GET" && path === workspaceRoutes.export) {
    sendOk(response, workspaceService.export());
    return;
  }

  if (method === "POST" && path === workspaceRoutes.import) {
    sendOk(response, workspaceService.import(await readWorkspaceImport(request)));
    return;
  }

  if (method === "GET" && path === workspaceRoutes.audit) {
    sendOk(response, workspaceService.audit());
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
  const target = resolved.startsWith(staticRoot) && existsSync(resolved) && statSync(resolved).isFile()
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const service = createWorkspaceService(undefined, createServerAiProvider());
  const server = createApp(service);

  server.listen(port, "127.0.0.1", () => {
    console.log(`Work Graph Foundry backend listening at http://127.0.0.1:${port}`);
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
