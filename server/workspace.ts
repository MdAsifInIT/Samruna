import type {
  DemoOrganization,
  GovernanceDecisionRequest,
  ProposalCreateRequest,
  ProposalSelectRequest,
  ScenarioSelectionRequest,
  WorkspaceImportRequest,
  WorkspaceResetRequest,
  WorkspaceSnapshot,
  WorkflowStageSnapshot
} from "../src/domain/api";
import { recommendLearningUpdate, runApprovedWorkflow } from "../src/domain/execution";
import { listDemoScenarios, loadDemoScenario, validateDemoFixtures } from "../src/domain/fixtures";
import { buildWorkGraph } from "../src/domain/graph";
import { auditFromGovernance, canExecute, createAuditEvent, createGovernanceRecord } from "../src/domain/governance";
import { ingestWorkTraces } from "../src/domain/ingestion";
import { detectWorkPatterns } from "../src/domain/patterns";
import {
  createMockAiProviderSnapshot,
  createSeedDemoState,
  exportRunSummary,
  importRunSummary,
  type AiInvocationMetadata,
  type AiProviderSnapshot,
  type PersistedDemoState
} from "../src/domain/persistence";
import { generateAutomationProposal } from "../src/domain/planner";
import { simulateAutomation } from "../src/domain/simulation";
import { AiProviderError, MockAiProvider, type AiProvider, type ProposalContext } from "../src/ai/providers";
import type {
  AuditEvent,
  AutomationProposal,
  DemoScenario,
  GovernanceDecision,
  GovernanceRecord,
  IngestionResult,
  LearningRecommendation,
  ScenarioId,
  SimulationResult
} from "../src/domain/types";
import { openWorkspaceDatabase, type WorkspaceDatabase } from "./db";

const PROPOSAL_GENERATED_AT_BASE = Date.UTC(2026, 4, 16, 9, 40, 0);

export const demoOrganization: DemoOrganization = {
  id: "synthetic-foundry-org",
  name: "Synthetic Foundry Operations",
  description: "Seeded local organization used for the Work Graph Foundry full-stack demo.",
  syntheticDataNotice: "All organization records, people, systems, tickets, vendors, approvals, and traces are synthetic.",
  scenarioIds: ["it-access", "procurement-intake"]
};

interface WorkspaceComputation {
  scenario: DemoScenario;
  ingestion?: IngestionResult;
  patternDetection?: ReturnType<typeof detectWorkPatterns>;
  graph?: ReturnType<typeof buildWorkGraph>;
  proposal?: AutomationProposal;
  proposalVersions: AutomationProposal[];
  simulation?: SimulationResult;
  governanceRecords: GovernanceRecord[];
  executionRun?: PersistedDemoState["executionRuns"][number];
  learningRecommendation?: LearningRecommendation;
  auditEvents: AuditEvent[];
  executionReady: boolean;
}

export class WorkspaceService {
  constructor(
    private readonly database: WorkspaceDatabase = openWorkspaceDatabase(),
    private readonly aiProvider: AiProvider = new MockAiProvider()
  ) {}

  health() {
    this.ensureState();

    return {
      status: "ok" as const,
      databaseReady: true,
      organizationId: demoOrganization.id,
      aiProvider: this.aiProviderSnapshot()
    };
  }

  scenarios() {
    return {
      organization: demoOrganization,
      scenarios: listDemoScenarios()
    };
  }

  snapshot(): WorkspaceSnapshot {
    const state = this.ensureState();
    const computation = this.compute(state);
    const validation = validateDemoFixtures(computation.scenario.fixtures);
    const aiProvider = this.aiProviderSnapshot(state.aiProvider.lastInvocation);

    return {
      organization: demoOrganization,
      state: {
        ...state,
        aiProvider
      },
      scenario: computation.scenario,
      scenarios: listDemoScenarios(),
      validation,
      ingestion: computation.ingestion,
      patternDetection: computation.patternDetection,
      graph: computation.graph,
      proposal: computation.proposal,
      proposalVersions: computation.proposalVersions,
      simulation: computation.simulation,
      governanceRecords: computation.governanceRecords,
      executionRun: computation.executionRun,
      learningRecommendation: computation.learningRecommendation,
      auditEvents: computation.auditEvents,
      aiProvider,
      executionReady: computation.executionReady,
      executionGateLabel: buildExecutionGateLabel(state.governanceDecision, computation.executionReady, computation.executionRun?.status),
      executionGateCopy: buildExecutionGateCopy(state.governanceDecision, computation.executionReady),
      workflowStages: buildWorkflowStages({
        sampleLoaded: state.sampleLoaded,
        analysisRequested: state.analysisRequested,
        graphReady: Boolean(computation.graph),
        proposalRequested: state.proposalRequested,
        governanceDecision: state.governanceDecision,
        executionReady: computation.executionReady,
        executionRun: Boolean(computation.executionRun),
        learningRecommendation: Boolean(computation.learningRecommendation)
      })
    };
  }

  selectScenario(input: ScenarioSelectionRequest): WorkspaceSnapshot {
    return this.reset({ scenarioId: input.scenarioId });
  }

  load(): WorkspaceSnapshot {
    return this.update((state) => ({
      ...state,
      sampleLoaded: true
    }));
  }

  analyze(): WorkspaceSnapshot {
    return this.update((state) => ({
      ...state,
      sampleLoaded: true,
      analysisRequested: true
    }));
  }

  async createProposal(input: ProposalCreateRequest = {}): Promise<WorkspaceSnapshot> {
    return this.updateAsync(async (state) => {
      const computation = this.compute({ ...state, sampleLoaded: true, analysisRequested: true });
      const topPattern = computation.patternDetection?.patterns[0];
      const topBottleneck = topPattern
        ? computation.patternDetection?.bottlenecks.find((bottleneck) => bottleneck.patternId === topPattern.id)
        : undefined;
      const topOpportunity = topPattern
        ? computation.patternDetection?.opportunities.find((opportunity) => opportunity.patternId === topPattern.id)
        : undefined;

      if (!topPattern || !computation.graph || !topBottleneck || !topOpportunity) {
        throw new WorkspaceError("proposal_not_ready", "Analyze the workflow before generating a proposal.");
      }

      const version = nextProposalVersion(state.proposals, topPattern.id);
      const changeSummary =
        input.changeSummary ??
        (state.proposals.length
          ? "Revision refreshed from the latest graph, policy, and bottleneck inputs."
          : "Initial proposal generated from the graph, policy, and bottleneck inputs.");
      const generatedAt = generatedAtForProposalVersion(version);
      const context: ProposalContext = {
        pattern: topPattern,
        graph: computation.graph,
        policyRules: computation.scenario.fixtures.policyRules,
        bottleneck: topBottleneck,
        opportunity: topOpportunity
      };
      const { proposal, invocation } = await this.generateProposalWithFallback({
        context,
        version,
        changeSummary,
        generatedAt
      });

      return {
        ...state,
        sampleLoaded: true,
        analysisRequested: true,
        proposalRequested: true,
        selectedProposalId: proposal.id,
        proposals: [...state.proposals.filter((item) => item.id !== proposal.id), proposal],
        governanceDecision: "pending",
        runRequested: false,
        governanceRecords: [],
        executionRuns: [],
        recommendations: [],
        simulation: undefined,
        aiProvider: this.aiProviderSnapshot(invocation)
      };
    });
  }

  selectProposal(input: ProposalSelectRequest): WorkspaceSnapshot {
    return this.update((state) => {
      if (!state.proposals.some((proposal) => proposal.id === input.proposalId)) {
        throw new WorkspaceError("proposal_not_found", `Unknown proposal: ${input.proposalId}`);
      }

      return {
        ...state,
        selectedProposalId: input.proposalId,
        governanceDecision: "pending",
        runRequested: false,
        governanceRecords: [],
        executionRuns: [],
        recommendations: []
      };
    });
  }

  decideGovernance(input: GovernanceDecisionRequest): WorkspaceSnapshot {
    return this.update((state) => {
      const computation = this.compute(state);

      if (!computation.proposal) {
        throw new WorkspaceError("proposal_not_ready", "Generate a proposal before recording governance.");
      }

      const records = buildGovernanceRecords(computation.proposal, input.decision, input.comments);

      return {
        ...state,
        governanceDecision: input.decision,
        governanceRecords: records,
        runRequested: false,
        executionRuns: [],
        recommendations: []
      };
    });
  }

  run(): WorkspaceSnapshot {
    return this.update((state) => {
      const computation = this.compute(state);

      if (!computation.proposal) {
        throw new WorkspaceError("proposal_not_ready", "Generate and approve a proposal before running execution.");
      }

      const approved = canExecute(state.governanceRecords, computation.proposal);

      if (!approved) {
        return {
          ...state,
          runRequested: false,
          executionRuns: []
        };
      }

      const execution = runApprovedWorkflow({
        proposal: computation.proposal,
        requestTrace: computation.scenario.fixtures.newIncomingTrace,
        approved
      });
      const recommendation = computation.simulation ? recommendLearningUpdate({ simulation: computation.simulation, execution }) : undefined;

      return {
        ...state,
        runRequested: true,
        executionRuns: [execution],
        recommendations: recommendation ? [recommendation] : []
      };
    });
  }

  reset(input: WorkspaceResetRequest = {}): WorkspaceSnapshot {
    const current = this.database.getState();
    const scenarioId = input.scenarioId ?? current?.selectedScenarioId ?? "it-access";
    const state = createSeedDemoState(scenarioId);
    this.persist(state);

    return this.snapshot();
  }

  export(): string {
    return exportRunSummary(this.snapshot().state);
  }

  import(input: WorkspaceImportRequest): WorkspaceSnapshot {
    const raw = typeof input.summary === "string" ? input.summary : JSON.stringify(input.summary);
    let imported: PersistedDemoState;

    try {
      imported = importRunSummary(raw);
    } catch {
      throw new WorkspaceError("invalid_import", "Imported execution summary did not match the workflow state contract.");
    }

    this.persist(imported);

    return this.snapshot();
  }

  audit(): AuditEvent[] {
    return this.snapshot().auditEvents;
  }

  close(): void {
    this.database.close();
  }

  private ensureState(): PersistedDemoState {
    const current = this.database.getState();

    if (current) {
      return current;
    }

    const seed = createSeedDemoState();
    this.persist(seed);

    return seed;
  }

  private update(updater: (state: PersistedDemoState) => PersistedDemoState): WorkspaceSnapshot {
    const current = this.ensureState();
    const updated = updater({ ...current, updatedAt: new Date().toISOString() });
    this.persist(this.hydrateStateArtifacts(updated));

    return this.snapshot();
  }

  private async updateAsync(updater: (state: PersistedDemoState) => Promise<PersistedDemoState>): Promise<WorkspaceSnapshot> {
    const current = this.ensureState();
    const updated = await updater({ ...current, updatedAt: new Date().toISOString() });
    this.persist(this.hydrateStateArtifacts(updated));

    return this.snapshot();
  }

  private persist(state: PersistedDemoState): void {
    this.database.saveState(state, artifactsFromState(state));
  }

  private async generateProposalWithFallback(input: {
    context: ProposalContext;
    version: number;
    changeSummary: string;
    generatedAt: string;
  }): Promise<{ proposal: AutomationProposal; invocation: AiInvocationMetadata }> {
    const providerStatus = this.aiProvider.status;

    try {
      const generated = await this.aiProvider.generateProposal(input.context);

      return {
        proposal: normalizeProviderProposal(generated, input),
        invocation: {
          providerMode: providerStatus.mode,
          providerLabel: providerStatus.label,
          model: providerStatus.model,
          status: "succeeded",
          validationStatus: providerStatus.mode === "openai" ? "validated" : "not_applicable",
          requestedAt: input.generatedAt,
          completedAt: input.generatedAt
        }
      };
    } catch (error) {
      return {
        proposal: generateAutomationProposal({
          ...input.context,
          version: input.version,
          changeSummary: input.changeSummary,
          generatedAt: input.generatedAt
        }),
        invocation: {
          providerMode: providerStatus.mode,
          providerLabel: providerStatus.label,
          model: providerStatus.model,
          status: "fallback",
          validationStatus: "failed",
          requestedAt: input.generatedAt,
          completedAt: input.generatedAt,
          fallbackReason: "Deterministic mock proposal used after provider failure.",
          errorCode: providerErrorCode(error)
        }
      };
    }
  }

  private aiProviderSnapshot(lastInvocation?: AiInvocationMetadata): AiProviderSnapshot {
    if (this.aiProvider.status.mode === "mock") {
      return createMockAiProviderSnapshot(lastInvocation);
    }

    return {
      mode: this.aiProvider.status.mode,
      label: this.aiProvider.status.label,
      available: this.aiProvider.status.available,
      model: this.aiProvider.status.model,
      lastInvocation
    };
  }

  private hydrateStateArtifacts(state: PersistedDemoState): PersistedDemoState {
    const computation = this.compute(state);

    return {
      ...state,
      graph: computation.graph,
      selectedProposalId: computation.proposal?.id,
      governanceRecords: computation.governanceRecords,
      simulation: computation.simulation,
      executionRuns: computation.executionRun ? [computation.executionRun] : [],
      recommendations: computation.learningRecommendation ? [computation.learningRecommendation] : [],
      auditEvents: computation.auditEvents,
      updatedAt: new Date().toISOString()
    };
  }

  private compute(state: PersistedDemoState): WorkspaceComputation {
    const scenario = loadDemoScenario(state.selectedScenarioId);
    const ingestion = state.analysisRequested
      ? ingestWorkTraces(scenario.fixtures.rawTraces, scenario.fixtures.approvalHistory)
      : undefined;
    const patternDetection = ingestion ? detectWorkPatterns(ingestion.items) : undefined;
    const topPattern = patternDetection?.patterns[0];
    const graph = ingestion ? buildWorkGraph(ingestion.items, scenario.id, topPattern?.id ?? `scenario-${scenario.id}`) : undefined;
    const proposalVersions = sortProposalVersions(state.proposals);
    const proposal = pickProposalVersion(state.proposals, state.selectedProposalId);
    const simulation = proposal && ingestion ? simulateAutomation(proposal, ingestion.items) : undefined;
    const governanceRecords = state.governanceRecords;
    const executionReady = proposal ? canExecute(governanceRecords, proposal) : false;
    const executionRun = state.executionRuns[0];
    const learningRecommendation = state.recommendations[0];
    const auditEvents = buildAuditEvents({
      state,
      scenario,
      proposal,
      ingestion,
      governanceRecords,
      executionStatus: executionRun?.status,
      recommendation: learningRecommendation
    });

    return {
      scenario,
      ingestion,
      patternDetection,
      graph,
      proposal,
      proposalVersions,
      simulation,
      governanceRecords,
      executionRun,
      learningRecommendation,
      auditEvents,
      executionReady
    };
  }
}

export class WorkspaceError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export function createWorkspaceService(database?: WorkspaceDatabase, aiProvider?: AiProvider): WorkspaceService {
  return new WorkspaceService(database, aiProvider);
}

function normalizeProviderProposal(
  proposal: AutomationProposal,
  input: {
    context: ProposalContext;
    version: number;
    changeSummary: string;
    generatedAt: string;
  }
): AutomationProposal {
  return {
    ...proposal,
    id: `proposal-${input.context.pattern.id}-v${input.version}`,
    patternId: input.context.pattern.id,
    version: input.version,
    changeSummary: input.changeSummary,
    generatedAt: input.generatedAt
  };
}

function providerErrorCode(error: unknown): string {
  if (error instanceof AiProviderError) {
    return error.code;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return "openai_timeout";
  }

  return "provider_error";
}

function artifactsFromState(state: PersistedDemoState) {
  const scenarioId = state.selectedScenarioId;
  const artifacts: Array<{ kind: string; artifactId: string; scenarioId: ScenarioId; payload: unknown }> = [];

  if (state.aiProvider.lastInvocation) {
    artifacts.push({
      kind: "model_invocation",
      artifactId: `${state.aiProvider.lastInvocation.providerMode}-${state.aiProvider.lastInvocation.requestedAt}`,
      scenarioId,
      payload: state.aiProvider.lastInvocation
    });
  }

  if (state.graph) {
    artifacts.push({ kind: "graph", artifactId: state.graph.id, scenarioId, payload: state.graph });
  }

  for (const proposal of state.proposals) {
    artifacts.push({ kind: "proposal", artifactId: proposal.id, scenarioId, payload: proposal });
  }

  if (state.simulation) {
    artifacts.push({ kind: "simulation", artifactId: state.simulation.proposalId, scenarioId, payload: state.simulation });
  }

  for (const record of state.governanceRecords) {
    artifacts.push({ kind: "governance", artifactId: record.id, scenarioId, payload: record });
  }

  for (const run of state.executionRuns) {
    artifacts.push({ kind: "execution", artifactId: run.id, scenarioId, payload: run });
  }

  for (const recommendation of state.recommendations) {
    artifacts.push({ kind: "recommendation", artifactId: recommendation.id, scenarioId, payload: recommendation });
  }

  for (const event of state.auditEvents) {
    artifacts.push({ kind: "audit", artifactId: event.id, scenarioId, payload: event });
  }

  return artifacts;
}

function buildGovernanceRecords(proposal: AutomationProposal, decision: GovernanceDecision, comments?: string) {
  const pending = createGovernanceRecord({
    proposal,
    decision: "pending",
    reviewerRole: "process_owner",
    comments: "Process owner review opened for governed workflow automation.",
    timestamp: "2026-05-16T10:00:00Z"
  });

  if (decision === "approved") {
    return [
      pending,
      createGovernanceRecord({
        proposal,
        decision: "approved",
        reviewerRole: "compliance",
        comments: comments ?? "Approved for low-risk requests with exception escalation and audit logging.",
        timestamp: "2026-05-16T11:00:00Z"
      })
    ];
  }

  if (decision === "rejected") {
    return [
      pending,
      createGovernanceRecord({
        proposal,
        decision: "rejected",
        reviewerRole: "compliance",
        comments: comments ?? "Rejected pending additional control evidence before execution.",
        timestamp: "2026-05-16T11:00:00Z"
      })
    ];
  }

  if (decision === "changes_requested") {
    return [
      pending,
      createGovernanceRecord({
        proposal,
        decision: "changes_requested",
        reviewerRole: "process_owner",
        comments: comments ?? "Changes requested before this proposal can be approved for execution.",
        timestamp: "2026-05-16T11:00:00Z"
      })
    ];
  }

  return [pending];
}

function buildAuditEvents(input: {
  state: PersistedDemoState;
  scenario: DemoScenario;
  proposal?: AutomationProposal;
  ingestion?: IngestionResult;
  governanceRecords: GovernanceRecord[];
  executionStatus?: string;
  recommendation?: LearningRecommendation;
}): AuditEvent[] {
  const events: AuditEvent[] = [];

  if (input.state.sampleLoaded) {
    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-loaded`,
        timestamp: "2026-05-16T09:05:00Z",
        actor: "demo_operator",
        action: "Workflow loaded",
        detail: `${input.scenario.label} fixture set loaded from local sample data.`
      })
    );
  }

  if (input.state.analysisRequested && input.ingestion) {
    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-analysis`,
        timestamp: "2026-05-16T09:20:00Z",
        actor: "observer_agent",
        action: "Workflow analyzed",
        detail: `${input.ingestion.summary.normalizedItemCount} work items normalized with ${input.ingestion.summary.issueCount} warnings.`
      })
    );
  }

  if (input.state.proposalRequested) {
    const providerDetail = providerAuditDetail(input.state.aiProvider);

    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-proposal-${input.proposal?.version ?? "requested"}`,
        timestamp: "2026-05-16T09:40:00Z",
        actor: "planner_agent",
        action:
          input.state.aiProvider.lastInvocation?.providerMode === "openai" &&
          input.state.aiProvider.lastInvocation.status === "succeeded"
            ? "Live OpenAI proposal generated"
            : input.state.aiProvider.lastInvocation?.status === "fallback"
              ? "Fallback proposal generated"
              : "Mock proposal generated",
        detail: input.proposal
          ? `Proposal v${input.proposal.version} inputs, assumptions, policy checks, actions, and escalations were made reviewable. ${providerDetail}`
          : `Proposal inputs, assumptions, policy checks, actions, and escalations were made reviewable. ${providerDetail}`
      })
    );
  }

  events.push(...input.governanceRecords.map(auditFromGovernance));

  if (input.executionStatus) {
    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-execution-${input.executionStatus}`,
        timestamp: "2026-05-16T11:20:00Z",
        actor: "executor_agent",
        action: "Simulated execution run",
        detail: `Simulated execution finished with status ${input.executionStatus}.`
      })
    );
  }

  if (input.recommendation) {
    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-learning`,
        timestamp: "2026-05-16T11:30:00Z",
        actor: "learner_agent",
        action: "Recommendation created",
        detail: input.recommendation.recommendation
      })
    );
  }

  return events;
}

function buildWorkflowStages(input: {
  sampleLoaded: boolean;
  analysisRequested: boolean;
  graphReady: boolean;
  proposalRequested: boolean;
  governanceDecision: GovernanceDecision;
  executionReady: boolean;
  executionRun?: boolean;
  learningRecommendation?: boolean;
}): WorkflowStageSnapshot[] {
  const stages: Array<Omit<WorkflowStageSnapshot, "state">> = [
    { id: "load-scenario", index: 1, label: "Load Workflow", detail: "Load the selected trace set." },
    { id: "analyze-workflow", index: 2, label: "Analyze Workflow", detail: "Normalize traces and surface issues." },
    { id: "inspect-graph", index: 3, label: "Inspect Graph", detail: "Review graph risk, delays, and exceptions." },
    { id: "generate-proposal", index: 4, label: "Generate Proposal", detail: "Produce a governed proposal from the top pattern." },
    { id: "review-governance", index: 5, label: "Review Governance", detail: "Scan policy checks, escalations, and results." },
    { id: "approve-reject", index: 6, label: "Approve/Reject", detail: "Human review opens or blocks execution." },
    { id: "run-mock", index: 7, label: "Run Simulation", detail: "Run simulated tools after approval." },
    { id: "review-audit", index: 8, label: "Review Audit/Recommendation", detail: "Inspect the audit trail and learning output." }
  ];
  const firstIncomplete = firstIncompleteIndex(stages, input);

  return stages.map((stage, index) => {
    const complete =
      (stage.id === "load-scenario" && input.sampleLoaded) ||
      (stage.id === "analyze-workflow" && input.analysisRequested) ||
      (stage.id === "inspect-graph" && input.graphReady) ||
      (stage.id === "generate-proposal" && input.proposalRequested) ||
      (stage.id === "review-governance" && input.proposalRequested) ||
      (stage.id === "approve-reject" && input.governanceDecision !== "pending") ||
      (stage.id === "run-mock" && input.executionRun && input.executionReady) ||
      (stage.id === "review-audit" && input.executionRun && input.learningRecommendation);
    const locked =
      (stage.id === "analyze-workflow" && !input.sampleLoaded) ||
      (stage.id === "inspect-graph" && !input.analysisRequested) ||
      (stage.id === "generate-proposal" && !input.graphReady) ||
      (stage.id === "review-governance" && !input.proposalRequested) ||
      (stage.id === "approve-reject" && !input.proposalRequested) ||
      (stage.id === "run-mock" && !input.executionReady) ||
      (stage.id === "review-audit" && !input.executionRun && !input.learningRecommendation);

    return {
      ...stage,
      state: complete ? "complete" : locked ? "locked" : index === firstIncomplete ? "current" : "available"
    };
  });
}

function providerAuditDetail(provider: AiProviderSnapshot): string {
  const invocation = provider.lastInvocation;

  if (!invocation) {
    return `Provider mode: ${provider.label}.`;
  }

  const model = invocation.model ? ` Model: ${invocation.model}.` : "";

  if (invocation.status === "fallback") {
    return `Provider mode: ${invocation.providerLabel}.${model} Fallback reason code: ${invocation.errorCode ?? "provider_error"}.`;
  }

  return `Provider mode: ${invocation.providerLabel}.${model} Output validation: ${invocation.validationStatus}.`;
}

function firstIncompleteIndex(
  stages: Array<Omit<WorkflowStageSnapshot, "state">>,
  input: {
    sampleLoaded: boolean;
    analysisRequested: boolean;
    graphReady: boolean;
    proposalRequested: boolean;
    governanceDecision: GovernanceDecision;
    executionReady: boolean;
    executionRun?: boolean;
    learningRecommendation?: boolean;
  }
): number {
  return stages.findIndex((stage) => {
    switch (stage.id) {
      case "load-scenario":
        return !input.sampleLoaded;
      case "analyze-workflow":
        return !input.analysisRequested;
      case "inspect-graph":
        return !input.graphReady;
      case "generate-proposal":
        return !input.proposalRequested;
      case "review-governance":
        return !input.proposalRequested;
      case "approve-reject":
        return input.governanceDecision === "pending";
      case "run-mock":
        return !(input.executionRun && input.executionReady);
      case "review-audit":
        return !(input.executionRun && input.learningRecommendation);
      default:
        return false;
    }
  });
}

function buildExecutionGateLabel(
  governanceDecision: GovernanceDecision,
  executionReady: boolean,
  executionStatus?: string
): string {
  if (executionReady) {
    return executionStatus ?? "Governance approved";
  }

  return governanceDecision === "rejected" ? "Blocked by rejection" : "Blocked until approval";
}

function buildExecutionGateCopy(governanceDecision: GovernanceDecision, executionReady: boolean): string {
  if (executionReady) {
    return "Governance has opened the gate for this proposal version.";
  }

  return governanceDecision === "rejected"
    ? "This proposal was rejected, so execution stays blocked until a new review approves it."
    : "This proposal is still awaiting approval, so execution stays blocked.";
}

function pickProposalVersion(proposals: AutomationProposal[], selectedProposalId?: string): AutomationProposal | undefined {
  if (!proposals.length) {
    return undefined;
  }

  return proposals.find((proposal) => proposal.id === selectedProposalId) ?? sortProposalVersions(proposals).at(-1);
}

function sortProposalVersions(proposals: AutomationProposal[]): AutomationProposal[] {
  return [...proposals].sort((a, b) => a.version - b.version || a.id.localeCompare(b.id));
}

function nextProposalVersion(proposals: AutomationProposal[], patternId: string): number {
  const versions = proposals.filter((proposal) => proposal.patternId === patternId).map((proposal) => proposal.version);

  return versions.length ? Math.max(...versions) + 1 : 1;
}

function generatedAtForProposalVersion(version: number): string {
  return new Date(PROPOSAL_GENERATED_AT_BASE + (version - 1) * 20 * 60 * 1000).toISOString();
}
