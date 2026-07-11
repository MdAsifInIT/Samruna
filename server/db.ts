import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  createSeedDemoState,
  DEMO_STATE_VERSION,
  importRunSummary,
  type PersistedDemoState
} from "../src/domain/persistence";
import type { ScenarioId } from "../src/domain/types";

export interface WorkspaceRecord {
  id: string;
  organizationId: string;
  state: PersistedDemoState;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  expiresAt?: string;
}

export interface WorkspaceArtifact {
  kind: string;
  artifactId: string;
  scenarioId: ScenarioId;
  payload: unknown;
}

export interface StoredWorkspaceArtifact extends WorkspaceArtifact {
  createdAt: string;
}

export const DEFAULT_WORKSPACE_ID = "local-demo";
export const DEMO_SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const SYNTHETIC_ORGANIZATION_ID = "synthetic-org-samruna";
export const DEFAULT_DB_PATH = join(process.cwd(), ".samruna", "samruna.sqlite");

export function resolveWorkspaceDbPath(dbPath?: string): string {
  return dbPath ?? process.env.SAMRUNA_DB_PATH ?? process.env.SAMRUNA_SQLITE_PATH ?? DEFAULT_DB_PATH;
}

export function openWorkspaceDatabase(dbPath = resolveWorkspaceDbPath()): WorkspaceDatabase {
  return new WorkspaceDatabase(dbPath);
}

export class WorkspaceDatabase {
  private readonly db: DatabaseSync;
  private readonly now: () => Date;

  constructor(dbPath = resolveWorkspaceDbPath(), now: () => Date = () => new Date()) {
    this.now = now;
    mkdirSync(dirname(dbPath), { recursive: true });

    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      synthetic INTEGER NOT NULL CHECK (synthetic IN (0, 1)),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id),
      state_version INTEGER NOT NULL,
      selected_scenario_id TEXT NOT NULL,
      state_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_accessed_at TEXT NOT NULL,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS workflow_artifacts (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      artifact_type TEXT NOT NULL,
      scenario_id TEXT NOT NULL,
      artifact_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

    migrateWorkspaceSessions(this.db);

    seedOrganization(this.db);
    seedWorkspace(this.db);
  }

  getWorkspace(id = DEFAULT_WORKSPACE_ID): WorkspaceRecord {
    this.expireWorkspaceIfIdle(id);
    this.touchWorkspace(id);
    return readWorkspace(this.db, id);
  }

  saveWorkspace(state: PersistedDemoState, id = DEFAULT_WORKSPACE_ID): WorkspaceRecord {
    return writeWorkspace(this.db, state, id, undefined, this.now());
  }

  resetWorkspace(scenarioId: ScenarioId = "it-access", id = DEFAULT_WORKSPACE_ID): WorkspaceRecord {
    return writeWorkspace(this.db, createSeedDemoState(scenarioId), id, undefined, this.now());
  }

  getState(id = DEFAULT_WORKSPACE_ID): PersistedDemoState | undefined {
    try {
      this.expireWorkspaceIfIdle(id);
      this.touchWorkspace(id);
      return readWorkspace(this.db, id).state;
    } catch {
      return undefined;
    }
  }

  saveState(state: PersistedDemoState, artifacts?: WorkspaceArtifact[], id = DEFAULT_WORKSPACE_ID): void {
    writeWorkspace(this.db, state, id, artifacts, this.now());
  }

  touchWorkspace(id: string, now = this.now()): void {
    const accessedAt = now.toISOString();
    const expiresAt = id === DEFAULT_WORKSPACE_ID ? null : new Date(now.getTime() + DEMO_SESSION_TTL_MS).toISOString();
    this.db.prepare("UPDATE workspaces SET last_accessed_at = ?, expires_at = ? WHERE id = ?").run(accessedAt, expiresAt, id);
  }

  purgeExpiredWorkspaces(now = this.now()): number {
    return Number(
      this.db.prepare("DELETE FROM workspaces WHERE id <> ? AND expires_at IS NOT NULL AND expires_at <= ?")
        .run(DEFAULT_WORKSPACE_ID, now.toISOString()).changes
    );
  }

  private expireWorkspaceIfIdle(id: string, now = this.now()): void {
    if (id === DEFAULT_WORKSPACE_ID) {
      return;
    }

    this.db.prepare("DELETE FROM workspaces WHERE id = ? AND expires_at IS NOT NULL AND expires_at <= ?")
      .run(id, now.toISOString());
  }

  listArtifacts(id = DEFAULT_WORKSPACE_ID): StoredWorkspaceArtifact[] {
    const rows = this.db
      .prepare(
        `SELECT artifact_type, scenario_id, id, artifact_json, created_at
         FROM workflow_artifacts
         WHERE workspace_id = ?
         ORDER BY created_at, id`
      )
      .all(id) as unknown as ArtifactRow[];

    return rows.map((row) => ({
      kind: row.artifact_type,
      artifactId: domainArtifactId(id, row.id),
      scenarioId: row.scenario_id as ScenarioId,
      payload: JSON.parse(row.artifact_json) as unknown,
      createdAt: row.created_at
    }));
  }

  close(): void {
    this.db.close();
  }
}

function seedOrganization(db: DatabaseSync): void {
  db.prepare(
    `INSERT OR IGNORE INTO organizations (id, name, synthetic, created_at)
     VALUES (?, ?, 1, ?)`
  ).run(SYNTHETIC_ORGANIZATION_ID, "Synthetic Foundry Operations", "2026-05-16T09:00:00Z");
}

function seedWorkspace(db: DatabaseSync): void {
  const existing = db.prepare("SELECT id FROM workspaces WHERE id = ?").get(DEFAULT_WORKSPACE_ID);

  if (!existing) {
    writeWorkspace(db, createSeedDemoState(), DEFAULT_WORKSPACE_ID);
  }
}

function readWorkspace(db: DatabaseSync, id: string): WorkspaceRecord {
  const row = db
    .prepare(
      `SELECT id, organization_id, state_json, created_at, updated_at, last_accessed_at, expires_at
       FROM workspaces
       WHERE id = ?`
    )
    .get(id) as WorkspaceRow | undefined;

  if (!row) {
    throw new Error(`Workspace not found: ${id}`);
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    state: importRunSummary(row.state_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastAccessedAt: row.last_accessed_at,
    expiresAt: row.expires_at ?? undefined
  };
}

function writeWorkspace(
  db: DatabaseSync,
  state: PersistedDemoState,
  id: string,
  artifacts?: WorkspaceArtifact[],
  now = new Date()
): WorkspaceRecord {
  const current = db.prepare("SELECT created_at FROM workspaces WHERE id = ?").get(id) as
    | { created_at: string }
    | undefined;
  const updatedAt = state.updatedAt || new Date().toISOString();
  const createdAt = current?.created_at ?? updatedAt;
  const lastAccessedAt = now.toISOString();
  const expiresAt = id === DEFAULT_WORKSPACE_ID ? null : new Date(now.getTime() + DEMO_SESSION_TTL_MS).toISOString();

  db.prepare(
    `INSERT INTO workspaces (
       id,
       organization_id,
       state_version,
       selected_scenario_id,
       state_json,
       created_at,
       updated_at,
       last_accessed_at,
       expires_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       state_version = excluded.state_version,
       selected_scenario_id = excluded.selected_scenario_id,
       state_json = excluded.state_json,
       updated_at = excluded.updated_at,
       last_accessed_at = excluded.last_accessed_at,
       expires_at = excluded.expires_at`
  ).run(
    id,
    SYNTHETIC_ORGANIZATION_ID,
    DEMO_STATE_VERSION,
    state.selectedScenarioId,
    JSON.stringify(state),
    createdAt,
    updatedAt,
    lastAccessedAt,
    expiresAt
  );

  persistArtifacts(db, id, state, artifacts);

  return readWorkspace(db, id);
}

function persistArtifacts(
  db: DatabaseSync,
  workspaceId: string,
  state: PersistedDemoState,
  artifacts?: WorkspaceArtifact[]
): void {
  db.prepare("DELETE FROM workflow_artifacts WHERE workspace_id = ?").run(workspaceId);

  const insert = db.prepare(
    `INSERT INTO workflow_artifacts (id, workspace_id, artifact_type, scenario_id, artifact_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const scenarioId = state.selectedScenarioId;
  const createdAt = state.updatedAt;

  if (artifacts) {
    for (const artifact of artifacts) {
      insert.run(
        storedArtifactId(workspaceId, `${artifact.kind}-${artifact.artifactId}`),
        workspaceId,
        artifact.kind,
        artifact.scenarioId,
        JSON.stringify(artifact.payload),
        createdAt
      );
    }

    return;
  }

  if (state.graph) {
    insert.run(storedArtifactId(workspaceId, state.graph.id), workspaceId, "graph", scenarioId, JSON.stringify(state.graph), createdAt);
  }

  for (const proposal of state.proposals) {
    insert.run(storedArtifactId(workspaceId, proposal.id), workspaceId, "proposal", scenarioId, JSON.stringify(proposal), createdAt);
  }

  for (const record of state.governanceRecords) {
    insert.run(storedArtifactId(workspaceId, record.id), workspaceId, "governance", scenarioId, JSON.stringify(record), record.timestamp);
  }

  if (state.simulation) {
    insert.run(
      storedArtifactId(workspaceId, `simulation-${state.simulation.proposalId}`),
      workspaceId,
      "simulation",
      scenarioId,
      JSON.stringify(state.simulation),
      createdAt
    );
  }

  for (const run of state.executionRuns) {
    insert.run(storedArtifactId(workspaceId, run.id), workspaceId, "execution", scenarioId, JSON.stringify(run), createdAt);
  }

  for (const recommendation of state.recommendations) {
    insert.run(storedArtifactId(workspaceId, recommendation.id), workspaceId, "learning", scenarioId, JSON.stringify(recommendation), createdAt);
  }

  for (const event of state.auditEvents) {
    insert.run(storedArtifactId(workspaceId, event.id), workspaceId, "audit", scenarioId, JSON.stringify(event), event.timestamp);
  }
}

function storedArtifactId(workspaceId: string, artifactId: string): string {
  return `${workspaceId}::${artifactId}`;
}

function domainArtifactId(workspaceId: string, storedId: string): string {
  const prefix = `${workspaceId}::`;
  return storedId.startsWith(prefix) ? storedId.slice(prefix.length) : storedId;
}

interface WorkspaceRow {
  id: string;
  organization_id: string;
  state_json: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  expires_at: string | null;
}

function migrateWorkspaceSessions(db: DatabaseSync): void {
  const columns = new Set(
    (db.prepare("PRAGMA table_info(workspaces)").all() as unknown as Array<{ name: string }>).map((column) => column.name)
  );

  if (!columns.has("last_accessed_at")) {
    db.exec("ALTER TABLE workspaces ADD COLUMN last_accessed_at TEXT");
  }
  if (!columns.has("expires_at")) {
    db.exec("ALTER TABLE workspaces ADD COLUMN expires_at TEXT");
  }
  db.exec("UPDATE workspaces SET last_accessed_at = COALESCE(last_accessed_at, updated_at)");
}

interface ArtifactRow {
  id: string;
  artifact_type: string;
  scenario_id: string;
  artifact_json: string;
  created_at: string;
}
