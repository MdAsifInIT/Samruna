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

const DEFAULT_WORKSPACE_ID = "local-demo";
const SYNTHETIC_ORGANIZATION_ID = "synthetic-org-foundry-demo";
export const DEFAULT_DB_PATH = join(process.cwd(), ".wgf", "work-graph-foundry.sqlite");

export function resolveWorkspaceDbPath(dbPath?: string): string {
  return dbPath ?? process.env.WGF_DB_PATH ?? process.env.WGF_SQLITE_PATH ?? DEFAULT_DB_PATH;
}

export function openWorkspaceDatabase(dbPath = resolveWorkspaceDbPath()): WorkspaceDatabase {
  return new WorkspaceDatabase(dbPath);
}

export class WorkspaceDatabase {
  private readonly db: DatabaseSync;

  constructor(dbPath = resolveWorkspaceDbPath()) {
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
      updated_at TEXT NOT NULL
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

    seedOrganization(this.db);
    seedWorkspace(this.db);
  }

  getWorkspace(id = DEFAULT_WORKSPACE_ID): WorkspaceRecord {
    return readWorkspace(this.db, id);
  }

  saveWorkspace(state: PersistedDemoState, id = DEFAULT_WORKSPACE_ID): WorkspaceRecord {
    return writeWorkspace(this.db, state, id);
  }

  resetWorkspace(scenarioId: ScenarioId = "it-access", id = DEFAULT_WORKSPACE_ID): WorkspaceRecord {
    return writeWorkspace(this.db, createSeedDemoState(scenarioId), id);
  }

  getState(id = DEFAULT_WORKSPACE_ID): PersistedDemoState | undefined {
    try {
      return readWorkspace(this.db, id).state;
    } catch {
      return undefined;
    }
  }

  saveState(state: PersistedDemoState, artifacts?: WorkspaceArtifact[], id = DEFAULT_WORKSPACE_ID): void {
    writeWorkspace(this.db, state, id, artifacts);
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
      artifactId: row.id,
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
      `SELECT id, organization_id, state_json, created_at, updated_at
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
    updatedAt: row.updated_at
  };
}

function writeWorkspace(
  db: DatabaseSync,
  state: PersistedDemoState,
  id: string,
  artifacts?: WorkspaceArtifact[]
): WorkspaceRecord {
  const current = db.prepare("SELECT created_at FROM workspaces WHERE id = ?").get(id) as
    | { created_at: string }
    | undefined;
  const updatedAt = state.updatedAt || new Date().toISOString();
  const createdAt = current?.created_at ?? updatedAt;

  db.prepare(
    `INSERT INTO workspaces (
       id,
       organization_id,
       state_version,
       selected_scenario_id,
       state_json,
       created_at,
       updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       state_version = excluded.state_version,
       selected_scenario_id = excluded.selected_scenario_id,
       state_json = excluded.state_json,
       updated_at = excluded.updated_at`
  ).run(
    id,
    SYNTHETIC_ORGANIZATION_ID,
    DEMO_STATE_VERSION,
    state.selectedScenarioId,
    JSON.stringify(state),
    createdAt,
    updatedAt
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
        `${artifact.kind}-${artifact.artifactId}`,
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
    insert.run(state.graph.id, workspaceId, "graph", scenarioId, JSON.stringify(state.graph), createdAt);
  }

  for (const proposal of state.proposals) {
    insert.run(proposal.id, workspaceId, "proposal", scenarioId, JSON.stringify(proposal), createdAt);
  }

  for (const record of state.governanceRecords) {
    insert.run(record.id, workspaceId, "governance", scenarioId, JSON.stringify(record), record.timestamp);
  }

  if (state.simulation) {
    insert.run(
      `simulation-${state.simulation.proposalId}`,
      workspaceId,
      "simulation",
      scenarioId,
      JSON.stringify(state.simulation),
      createdAt
    );
  }

  for (const run of state.executionRuns) {
    insert.run(run.id, workspaceId, "execution", scenarioId, JSON.stringify(run), createdAt);
  }

  for (const recommendation of state.recommendations) {
    insert.run(recommendation.id, workspaceId, "learning", scenarioId, JSON.stringify(recommendation), createdAt);
  }

  for (const event of state.auditEvents) {
    insert.run(event.id, workspaceId, "audit", scenarioId, JSON.stringify(event), event.timestamp);
  }
}

interface WorkspaceRow {
  id: string;
  organization_id: string;
  state_json: string;
  created_at: string;
  updated_at: string;
}

interface ArtifactRow {
  id: string;
  artifact_type: string;
  scenario_id: string;
  artifact_json: string;
  created_at: string;
}
