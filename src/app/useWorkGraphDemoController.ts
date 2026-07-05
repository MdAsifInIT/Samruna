import {
  Brain,
  ClipboardCheck,
  Database,
  GitBranch,
  Network,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createApiClient } from "./apiClient";
import { recommendLearningUpdate, runApprovedWorkflow } from "../domain/execution";
import { listDemoScenarios, loadDemoScenario, validateDemoFixtures } from "../domain/fixtures";
import { buildWorkGraph } from "../domain/graph";
import { auditFromGovernance, canExecute, createAuditEvent, createGovernanceRecord } from "../domain/governance";
import { ingestWorkTraces } from "../domain/ingestion";
import { detectWorkPatterns } from "../domain/patterns";
import {
  createSeedDemoState,
  createMockAiProviderSnapshot,
  exportRunSummary,
  importRunSummary,
  loadPersistedDemoState,
  resetPersistedDemoState,
  saveDemoState,
  type AiProviderSnapshot,
  type PersistedDemoState
} from "../domain/persistence";
import { generateAutomationProposal } from "../domain/planner";
import { simulateAutomation } from "../domain/simulation";
import type {
  WorkspaceSnapshot
} from "../domain/api";
import type {
  AuditEvent,
  AutomationProposal,
  DemoScenario,
  GovernanceDecision,
  GovernanceRecord,
  GraphEdge,
  GraphNode,
  IngestionResult,
  LearningRecommendation,
  ScenarioId,
  SimulationCaseStatus,
  SourceChannel
} from "../domain/types";

export const scenarioOptions = listDemoScenarios();

export const channelLabels: Record<SourceChannel, string> = {
  email: "Email",
  ticket: "Tickets",
  chat: "Chat",
  approval_log: "Approvals",
  system_action: "System actions"
};

export type WorkflowStageId =
  | "load-scenario"
  | "analyze-workflow"
  | "inspect-graph"
  | "generate-proposal"
  | "review-governance"
  | "approve-reject"
  | "run-mock"
  | "review-audit";

export type WorkflowStageState = "complete" | "current" | "available" | "locked";

export interface WorkflowStageSnapshot {
  id: WorkflowStageId;
  index: number;
  label: string;
  detail: string;
  state: WorkflowStageState;
}

export interface SimulationCasePreviewItem {
  caseId: string;
  reason: string;
  status: SimulationCaseStatus;
  statusLabel: string;
}

export interface VisualGraphNode {
  node: GraphNode;
  x: number;
  y: number;
}

export interface VisualGraphEdge {
  id: string;
  label: string;
  source: VisualGraphNode;
  target: VisualGraphNode;
  exceptionRate: number;
}

export interface FoundationPanel {
  title: string;
  icon: LucideIcon;
  value: string;
  detail: string;
}

export type BackendSyncStatus = "connecting" | "synced" | "syncing" | "fallback" | "error";

const PROPOSAL_GENERATED_AT_BASE = Date.UTC(2026, 4, 16, 9, 40, 0);

export function useWorkGraphDemoController() {
  const [demoState, setDemoState] = useState<PersistedDemoState>(
    () => loadPersistedDemoState() ?? createSeedDemoState()
  );
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string>();
  const [selectedPatternId, setSelectedPatternId] = useState<string>();
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [backendSyncStatus, setBackendSyncStatus] = useState<BackendSyncStatus>("connecting");
  const [backendSyncError, setBackendSyncError] = useState("");
  const [healthProvider, setHealthProvider] = useState<AiProviderSnapshot>();
  const [backendWorkspace, setBackendWorkspace] = useState<WorkspaceSnapshot>();
  const backendQueue = useRef<Promise<void>>(Promise.resolve());

  const aiProvider = useMemo(
    () => ({ status: backendWorkspace?.aiProvider ?? demoState.aiProvider ?? healthProvider ?? createMockAiProviderSnapshot() }),
    [backendWorkspace?.aiProvider, demoState.aiProvider, healthProvider]
  );
  const apiClient = useMemo(() => createApiClient(), []);
  const localScenario = useMemo(() => loadDemoScenario(demoState.selectedScenarioId), [demoState.selectedScenarioId]);
  const localFixtures = localScenario.fixtures;
  const localValidation = useMemo(() => validateDemoFixtures(localFixtures), [localFixtures]);
  const localIngestion = useMemo(
    () => (demoState.analysisRequested ? ingestWorkTraces(localFixtures.rawTraces, localFixtures.approvalHistory) : undefined),
    [demoState.analysisRequested, localFixtures]
  );
  const localPatternDetection = useMemo(
    () => (localIngestion ? detectWorkPatterns(localIngestion.items) : undefined),
    [localIngestion]
  );
  const localTopPattern = localPatternDetection?.patterns[0];
  const localGraph = useMemo(
    () =>
      localIngestion
        ? buildWorkGraph(localIngestion.items, localScenario.id, localTopPattern?.id ?? `scenario-${localScenario.id}`)
        : undefined,
    [localIngestion, localScenario.id, localTopPattern?.id]
  );
  const localTopBottleneck = localTopPattern
    ? localPatternDetection?.bottlenecks.find((bottleneck) => bottleneck.patternId === localTopPattern.id)
    : undefined;
  const localTopOpportunity = localTopPattern
    ? localPatternDetection?.opportunities.find((opportunity) => opportunity.patternId === localTopPattern.id)
    : undefined;
  const localProposal = useMemo(() => pickProposalVersion(demoState.proposals, demoState.selectedProposalId), [
    demoState.proposals,
    demoState.selectedProposalId
  ]);
  const localProposalVersions = useMemo(() => sortProposalVersions(demoState.proposals), [demoState.proposals]);
  const localSimulation = localProposal && localIngestion ? simulateAutomation(localProposal, localIngestion.items) : undefined;
  const localGovernanceRecords = useMemo(
    () => (localProposal ? buildGovernanceRecords(localProposal, demoState.governanceDecision) : []),
    [demoState.governanceDecision, localProposal]
  );
  const localExecutionReady = localProposal ? canExecute(localGovernanceRecords, localProposal) : false;
  const localExecutionRun = useMemo(
    () =>
      localProposal && demoState.runRequested
        ? runApprovedWorkflow({
            proposal: localProposal,
            requestTrace: localFixtures.newIncomingTrace,
            approved: localExecutionReady
          })
        : undefined,
    [demoState.runRequested, localExecutionReady, localFixtures.newIncomingTrace, localProposal]
  );
  const localExecutionGateLabel = localExecutionReady
    ? localExecutionRun?.status ?? "Governance approved"
    : demoState.governanceDecision === "rejected"
      ? "Blocked by rejection"
      : "Blocked until approval";
  const localExecutionGateCopy = localExecutionReady
    ? "Governance has opened the gate for this proposal version."
    : demoState.governanceDecision === "rejected"
      ? "This proposal was rejected, so execution stays blocked until a new review approves it."
      : "This proposal is still awaiting approval, so execution stays blocked.";
  const localLearningRecommendation = useMemo(
    () =>
      localSimulation && localExecutionRun
        ? recommendLearningUpdate({ simulation: localSimulation, execution: localExecutionRun })
        : undefined,
    [localExecutionRun, localSimulation]
  );
  const authoritativeWorkspace = backendAvailable ? backendWorkspace : undefined;
  const activeState = authoritativeWorkspace?.state ?? demoState;
  const governanceDecisionLabel = governanceDecisionToLabel(activeState.governanceDecision);
  const scenario = authoritativeWorkspace?.scenario ?? localScenario;
  const fixtures = scenario.fixtures;
  const validation = authoritativeWorkspace?.validation ?? localValidation;
  const ingestion = authoritativeWorkspace?.ingestion ?? localIngestion;
  const patternDetection = authoritativeWorkspace?.patternDetection ?? localPatternDetection;
  const sampleItem = ingestion?.items[0];
  const topPattern = patternDetection?.patterns[0];
  const graph = authoritativeWorkspace?.graph ?? localGraph;
  const topBottleneck = topPattern
    ? patternDetection?.bottlenecks.find((bottleneck) => bottleneck.patternId === topPattern.id)
    : localTopBottleneck;
  const topOpportunity = topPattern
    ? patternDetection?.opportunities.find((opportunity) => opportunity.patternId === topPattern.id)
    : localTopOpportunity;
  const proposal = authoritativeWorkspace?.proposal ?? localProposal;
  const proposalVersions = authoritativeWorkspace?.proposalVersions ?? localProposalVersions;
  const proposalGenerationReady = Boolean(topPattern && graph && topBottleneck && topOpportunity);
  const simulation = authoritativeWorkspace?.simulation ?? localSimulation;
  const governanceRecords = authoritativeWorkspace?.governanceRecords ?? localGovernanceRecords;
  const executionReady = authoritativeWorkspace?.executionReady ?? localExecutionReady;
  const executionRun = authoritativeWorkspace?.executionRun ?? localExecutionRun;
  const executionGateLabel = authoritativeWorkspace?.executionGateLabel ?? localExecutionGateLabel;
  const executionGateCopy = authoritativeWorkspace?.executionGateCopy ?? localExecutionGateCopy;
  const learningRecommendation = authoritativeWorkspace?.learningRecommendation ?? localLearningRecommendation;
  const simulationCasePreview = useMemo<SimulationCasePreviewItem[]>(() => {
    if (!simulation) {
      return [];
    }

    return ["needs_human", "policy_risk"].reduce<SimulationCasePreviewItem[]>((items, status) => {
      const caseResult = simulation.caseResults.find((result) => result.status === status);

      if (caseResult) {
        items.push({
          ...caseResult,
          statusLabel: simulationCaseStatusLabel(caseResult.status)
        });
      }

      return items;
    }, []);
  }, [simulation]);
  const selectedGraphNode = useMemo(() => {
    if (!graph) {
      return undefined;
    }

    return graph.nodes.find((node) => node.id === selectedGraphNodeId) ?? graph.nodes[0];
  }, [graph, selectedGraphNodeId]);
  const selectedPattern = useMemo(() => {
    if (!patternDetection) {
      return undefined;
    }

    return patternDetection.patterns.find((pattern) => pattern.id === selectedPatternId) ?? patternDetection.patterns[0];
  }, [patternDetection, selectedPatternId]);
  const selectedBottleneck = selectedPattern
    ? patternDetection?.bottlenecks.find((bottleneck) => bottleneck.patternId === selectedPattern.id)
    : undefined;
  const selectedOpportunity = selectedPattern
    ? patternDetection?.opportunities.find((opportunity) => opportunity.patternId === selectedPattern.id)
    : undefined;
  const selectedGraphEdges =
    selectedGraphNode && graph
      ? graph.edges.filter((edge) => edge.source === selectedGraphNode.id || edge.target === selectedGraphNode.id)
      : [];
  const visualGraph = useMemo(() => (graph ? buildVisualGraph(graph.nodes, graph.edges) : undefined), [graph]);
  const localWorkflowStages = useMemo(
    () =>
      buildWorkflowStages({
        sampleLoaded: activeState.sampleLoaded,
        analysisRequested: activeState.analysisRequested,
        graphReady: Boolean(graph),
        proposalRequested: activeState.proposalRequested,
        governanceDecision: activeState.governanceDecision,
        executionReady,
        executionRun: Boolean(executionRun),
        learningRecommendation: Boolean(learningRecommendation)
      }),
    [
      activeState.analysisRequested,
      activeState.governanceDecision,
      activeState.proposalRequested,
      activeState.sampleLoaded,
      executionReady,
      executionRun,
      graph,
      learningRecommendation
    ]
  );
  const workflowStages = authoritativeWorkspace?.workflowStages ?? localWorkflowStages;
  const currentStage =
    workflowStages.find((stage) => stage.state === "current") ??
    workflowStages.find((stage) => stage.state === "locked") ??
    workflowStages.find((stage) => stage.state === "available");
  const localAuditEvents = useMemo(
    () =>
      buildAuditEvents({
        state: activeState,
        scenario,
        proposal,
        ingestion,
        governanceRecords,
        executionStatus: executionRun?.status,
        recommendation: learningRecommendation
      }),
    [activeState, executionRun?.status, governanceRecords, ingestion, learningRecommendation, proposal, scenario]
  );
  const auditEvents = authoritativeWorkspace?.auditEvents ?? localAuditEvents;
  const snapshot = useMemo<PersistedDemoState>(
    () => ({
      ...activeState,
      graph,
      selectedProposalId: proposal?.id,
      governanceRecords,
      simulation,
      executionRuns: executionRun ? [executionRun] : [],
      recommendations: learningRecommendation ? [learningRecommendation] : [],
      auditEvents,
      aiProvider: activeState.aiProvider ?? aiProvider.status,
      updatedAt: activeState.updatedAt
    }),
    [
      activeState,
      aiProvider.status,
      auditEvents,
      executionRun,
      governanceRecords,
      graph,
      learningRecommendation,
      proposal?.id,
      simulation
    ]
  );
  const topSystem = ingestion ? topEntry(ingestion.summary.systemCounts) : undefined;
  const foundationPanels = buildFoundationPanels(activeState, scenario, ingestion, proposal?.auditRationale);

  useEffect(() => {
    if (graph?.nodes.length) {
      setSelectedGraphNodeId((current) =>
        current && graph.nodes.some((node) => node.id === current) ? current : graph.nodes[0].id
      );
    } else {
      setSelectedGraphNodeId(undefined);
    }
  }, [graph]);

  useEffect(() => {
    if (patternDetection?.patterns.length) {
      setSelectedPatternId((current) =>
        current && patternDetection.patterns.some((pattern) => pattern.id === current)
          ? current
          : patternDetection.patterns[0].id
      );
    } else {
      setSelectedPatternId(undefined);
    }
  }, [patternDetection]);

  useEffect(() => {
    let active = true;

    refreshBackend()
      .then((workspace) => {
        if (!active) {
          return;
        }

        applyWorkspaceSnapshot(workspace);
      })
      .catch((error) => {
        if (active) {
          setBackendWorkspace(undefined);
          setBackendAvailable(false);
          setBackendSyncStatus("fallback");
          setBackendSyncError(messageFromApiError(error, "Backend is unavailable; changes are using the browser fallback mirror."));
        }
      });

    return () => {
      active = false;
    };
  }, [apiClient]);

  useEffect(() => {
    saveDemoState(snapshot);
  }, [snapshot]);

  const applyWorkspaceSnapshot = (workspace: WorkspaceSnapshot) => {
    setBackendWorkspace(workspace);
    setDemoState({
      ...workspace.state,
      aiProvider: workspace.aiProvider
    });
  };

  const refreshBackend = async (): Promise<WorkspaceSnapshot> => {
    setBackendSyncStatus("connecting");
    const [health, workspace] = await Promise.all([apiClient.getHealth(), apiClient.getWorkspace()]);

    setHealthProvider(health.aiProvider);
    setBackendAvailable(true);
    setBackendSyncStatus("synced");
    setBackendSyncError("");

    return workspace;
  };

  const runWorkspaceAction = (
    remoteAction: () => Promise<WorkspaceSnapshot>,
    fallbackAction: () => void,
    failureMessage = "Backend sync failed; the workspace did not accept that action. Use Retry backend or Reset workflow state before continuing."
  ) => {
    const shouldTryBackend = backendAvailable || backendSyncStatus === "connecting" || backendSyncStatus === "syncing";
    const canFallbackAfterConnectFailure = !backendAvailable && backendSyncStatus === "connecting";

    if (!shouldTryBackend) {
      setBackendWorkspace(undefined);
      fallbackAction();
      setBackendSyncStatus("fallback");
      setBackendSyncError("Backend is unavailable; changes are using the browser fallback mirror.");
      return;
    }

    setBackendSyncStatus("syncing");
    backendQueue.current = backendQueue.current
      .then(remoteAction)
      .then((workspace) => {
        setBackendAvailable(true);
        setBackendSyncStatus("synced");
        setBackendSyncError("");
        applyWorkspaceSnapshot(workspace);
      })
      .catch((error) => {
        if (canFallbackAfterConnectFailure) {
          setBackendWorkspace(undefined);
          fallbackAction();
          setBackendAvailable(false);
          setBackendSyncStatus("fallback");
          setBackendSyncError(messageFromApiError(error, "Backend is unavailable; changes are using the browser fallback mirror."));
          return;
        }

        setBackendWorkspace(undefined);
        setBackendAvailable(false);
        setBackendSyncStatus("error");
        setBackendSyncError(messageFromApiError(error, failureMessage));
      });
  };

  const updateState = (updater: (state: PersistedDemoState) => PersistedDemoState) => {
    setDemoState((current) => updater({ ...current, updatedAt: new Date().toISOString() }));
  };

  const selectScenario = (scenarioId: ScenarioId) => {
    setSelectedGraphNodeId(undefined);
    setSelectedPatternId(undefined);
    setExportText("");
    setImportText("");
    setImportError("");
    runWorkspaceAction(
      () => apiClient.selectScenario({ scenarioId }),
      () => setDemoState(createSeedDemoState(scenarioId, new Date().toISOString()))
    );
  };

  const resetDemo = () => {
    setSelectedGraphNodeId(undefined);
    setSelectedPatternId(undefined);
    setExportText("");
    setImportText("");
    setImportError("");
    runWorkspaceAction(
      () => apiClient.resetWorkspace({ scenarioId: activeState.selectedScenarioId }),
      () => setDemoState(resetPersistedDemoState(activeState.selectedScenarioId))
    );
  };

  const importSummary = () => {
    try {
      const imported = importRunSummary(importText);
      setSelectedGraphNodeId(undefined);
      setSelectedPatternId(undefined);
      setImportError("");
      runWorkspaceAction(
        () => apiClient.importWorkspace({ summary: importText }),
        () => setDemoState(imported),
        "Backend import failed; the imported state was not accepted by the backend."
      );
    } catch (error) {
      setImportError(
        error instanceof SyntaxError
          ? "Import failed: the provided execution summary is not valid JSON."
          : error instanceof Error
            ? error.message
            : "Import failed: the provided execution summary is not valid JSON."
      );
    }
  };

  const createProposalRevision = (changeSummary: string) => {
    if (!topPattern || !graph || !topBottleneck || !topOpportunity) {
      return;
    }

    runWorkspaceAction(
      () => apiClient.createProposal({ changeSummary }),
      () => updateState((state) => {
        const version = nextProposalVersion(state.proposals, topPattern.id);
        const generatedAt = generatedAtForProposalVersion(version);
        const nextProposal = generateAutomationProposal({
          pattern: topPattern,
          graph,
          policyRules: fixtures.policyRules,
          bottleneck: topBottleneck,
          opportunity: topOpportunity,
          version,
          changeSummary,
          generatedAt
        });

        return {
          ...state,
          proposalRequested: true,
          selectedProposalId: nextProposal.id,
          proposals: [...state.proposals.filter((proposal) => proposal.id !== nextProposal.id), nextProposal],
          governanceDecision: "pending",
          runRequested: false,
          governanceRecords: [],
          executionRuns: [],
          recommendations: [],
          simulation: undefined,
          aiProvider: createMockAiProviderSnapshot({
            providerMode: "mock",
            providerLabel: "Deterministic simulation",
            model: "deterministic-domain-planner",
            status: "succeeded",
            validationStatus: "not_applicable",
            requestedAt: generatedAt,
            completedAt: generatedAt
          })
        };
      })
    );
  };

  const generateProposalFromCurrentState = () => {
    createProposalRevision(
      activeState.proposals.length
        ? "Revision refreshed from the latest graph, policy, and bottleneck inputs."
        : "Initial proposal generated from the graph, policy, and bottleneck inputs."
    );
  };

  const createSelectedProposalRevision = () => {
    if (!proposal) {
      return;
    }

    createProposalRevision(
      `Revision v${nextProposalVersion(activeState.proposals, proposal.patternId)} refreshes governance review from the latest deterministic analysis.`
    );
  };

  const selectProposalVersion = (proposalId: string) => {
    runWorkspaceAction(
      () => apiClient.selectProposal({ proposalId }),
      () =>
        updateState((state) => ({
          ...state,
          selectedProposalId: proposalId,
          governanceDecision: "pending",
          runRequested: false
        }))
    );
  };

  const providerStatusLabel = providerStatusToLabel(aiProvider.status);
  const providerStatusDetail = providerStatusToDetail(aiProvider.status);
  const providerFallbackMessage = providerFallbackToMessage(aiProvider.status);

  return {
    aiProvider,
    auditEvents,
    channelLabels,
    currentStage,
    demoState: activeState,
    executionGateCopy,
    executionGateLabel,
    executionReady,
    executionRun,
    exportText,
    fixtures,
    foundationPanels,
    backendAvailable,
    backendSyncError,
    backendSyncStatus,
    governanceDecisionLabel,
    governanceRecords,
    graph,
    importError,
    importText,
    ingestion,
    learningRecommendation,
    patternDetection,
    proposal,
    proposalGenerationReady,
    proposalVersions,
    sampleItem,
    scenario,
    scenarioOptions,
    selectedBottleneck,
    selectedGraphEdges,
    selectedGraphNode,
    selectedOpportunity,
    selectedPattern,
    simulation,
    simulationCasePreview,
    snapshot,
    topBottleneck,
    topSystem,
    validation,
    visualGraph,
    workflowStages,
    providerStatusLabel,
    providerStatusDetail,
    providerFallbackMessage,
    actions: {
      analyzeWorkflow: () =>
        {
          runWorkspaceAction(
            () => apiClient.analyzeWorkflow(),
            () =>
              updateState((state) => ({
                ...state,
                analysisRequested: true
              }))
          );
        },
      approveProposal: () =>
        {
          runWorkspaceAction(
            () => apiClient.decideGovernance({ decision: "approved" }),
            () =>
              updateState((state) => ({
                ...state,
                governanceDecision: "approved"
              }))
          );
        },
      createSelectedProposalRevision,
      exportSummary: () => {
        if (backendAvailable) {
          setBackendSyncStatus("syncing");
          apiClient
            .exportWorkspace()
            .then((summary) => {
              setExportText(summary);
              setBackendSyncStatus("synced");
              setBackendSyncError("");
            })
            .catch((error) => {
              setBackendWorkspace(undefined);
              setBackendAvailable(false);
              setBackendSyncStatus("error");
              setBackendSyncError(messageFromApiError(error, "Backend export failed; showing browser fallback export."));
              setExportText(exportRunSummary(snapshot));
            });
          return;
        }

        setBackendSyncStatus("fallback");
        setBackendSyncError("Backend is unavailable; export was generated from the browser fallback mirror.");
        setExportText(exportRunSummary(snapshot));
      },
      generateProposalFromCurrentState,
      importSummary,
      loadSelectedScenario: () =>
        {
          runWorkspaceAction(
            () => apiClient.loadWorkflow(),
            () =>
              updateState((state) => ({
                ...state,
                sampleLoaded: true
              }))
          );
        },
      rejectProposal: () =>
        {
          runWorkspaceAction(
            () => apiClient.decideGovernance({ decision: "rejected" }),
            () =>
              updateState((state) => ({
                ...state,
                governanceDecision: "rejected"
              }))
          );
        },
      resetDemo,
      retryBackendSync: () => {
        refreshBackend()
          .then(applyWorkspaceSnapshot)
          .catch((error) => {
            setBackendWorkspace(undefined);
            setBackendAvailable(false);
            setBackendSyncStatus("fallback");
            setBackendSyncError(messageFromApiError(error, "Backend is still unavailable; browser fallback mirror remains active."));
          });
      },
      runMockExecution: () =>
        {
          runWorkspaceAction(
            () => apiClient.runApprovedWorkflow(),
            () =>
              updateState((state) => ({
                ...state,
                runRequested: true
              }))
          );
        },
      selectGraphNode: setSelectedGraphNodeId,
      selectPattern: setSelectedPatternId,
      selectProposalVersion,
      selectScenario,
      setExportText,
      setImportText
    }
  };
}

export type WorkGraphDemoController = ReturnType<typeof useWorkGraphDemoController>;

function messageFromApiError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return `${fallback} ${error.message}`;
  }

  return fallback;
}

function providerStatusToLabel(provider: AiProviderSnapshot): string {
  const invocation = provider.lastInvocation;

  if (invocation?.status === "fallback") {
    return "Fallback used";
  }

  if (provider.mode === "openai") {
    return provider.available ? "Live OpenAI" : "OpenAI unavailable";
  }

  return "Deterministic mock";
}

function providerStatusToDetail(provider: AiProviderSnapshot): string {
  const invocation = provider.lastInvocation;
  const model = invocation?.model ?? provider.model;
  const modelText = model ? `Model: ${model}. ` : "";

  if (invocation?.status === "fallback") {
    return `${modelText}Deterministic proposal used after ${invocation.errorCode ?? "provider_error"}.`;
  }

  if (invocation) {
    return `${modelText}Output validation: ${invocation.validationStatus}. Generated ${formatProposalTimestamp(invocation.completedAt)}.`;
  }

  if (provider.mode === "openai") {
    return `${modelText}Server-side provider is ready; proposals stay validated before persistence.`;
  }

  return `${modelText}No server key required; deterministic proposal generation is active.`;
}

function providerFallbackToMessage(provider: AiProviderSnapshot): string {
  const invocation = provider.lastInvocation;

  if (invocation?.status !== "fallback") {
    return "";
  }

  return `Live proposal generation fell back to deterministic planning. Reason code: ${invocation.errorCode ?? "provider_error"}.`;
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
    {
      id: "load-scenario",
      index: 1,
      label: "Load Workflow",
      detail: "Load the selected trace set."
    },
    {
      id: "analyze-workflow",
      index: 2,
      label: "Analyze Workflow",
      detail: "Normalize traces and surface issues."
    },
    {
      id: "inspect-graph",
      index: 3,
      label: "Inspect Graph",
      detail: "Review graph risk, delays, and exceptions."
    },
    {
      id: "generate-proposal",
      index: 4,
      label: "Generate Proposal",
      detail: "Produce a governed proposal from the top pattern."
    },
    {
      id: "review-governance",
      index: 5,
      label: "Review Governance",
      detail: "Scan policy checks, escalations, and results."
    },
    {
      id: "approve-reject",
      index: 6,
      label: "Approve/Reject",
      detail: "Human review opens or blocks execution."
    },
    {
      id: "run-mock",
      index: 7,
      label: "Run Simulation",
      detail: "Run simulated tools after approval."
    },
    {
      id: "review-audit",
      index: 8,
      label: "Review Audit/Recommendation",
      detail: "Inspect the audit trail and learning output."
    }
  ];

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
      state: complete ? "complete" : locked ? "locked" : index === firstIncompleteIndex(stages, input) ? "current" : "available"
    };
  });
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

function simulationCaseStatusLabel(status: SimulationCaseStatus): string {
  if (status === "needs_human") {
    return "Requires human review";
  }

  if (status === "policy_risk") {
    return "Policy concern";
  }

  if (status === "fail") {
    return "Failed";
  }

  return "Passed";
}

function pickProposalVersion(
  proposals: AutomationProposal[],
  selectedProposalId?: string
): AutomationProposal | undefined {
  if (!proposals.length) {
    return undefined;
  }

  return proposals.find((proposal) => proposal.id === selectedProposalId) ?? sortProposalVersions(proposals).at(-1);
}

function sortProposalVersions(proposals: AutomationProposal[]): AutomationProposal[] {
  return [...proposals].sort((a, b) => a.version - b.version || a.id.localeCompare(b.id));
}

export function nextProposalVersion(proposals: AutomationProposal[], patternId: string): number {
  const versions = proposals.filter((proposal) => proposal.patternId === patternId).map((proposal) => proposal.version);

  return versions.length ? Math.max(...versions) + 1 : 1;
}

function generatedAtForProposalVersion(version: number): string {
  return new Date(PROPOSAL_GENERATED_AT_BASE + (version - 1) * 20 * 60 * 1000).toISOString();
}

export function formatProposalTimestamp(timestamp?: string): string {
  return timestamp ? timestamp.replace(".000Z", "Z").replace("T", " ") : "Not recorded";
}

function buildVisualGraph(nodes: GraphNode[], edges: GraphEdge[]): { nodes: VisualGraphNode[]; edges: VisualGraphEdge[] } {
  const kindOrder: GraphNode["kind"][] = ["actor", "approval", "policy", "system", "action", "exception", "outcome"];
  const orderedNodes = [...nodes].sort((a, b) => {
    const kindDelta = kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind);

    return kindDelta || a.label.localeCompare(b.label);
  });
  const nodesByKind = new Map<GraphNode["kind"], GraphNode[]>();

  for (const node of orderedNodes) {
    nodesByKind.set(node.kind, [...(nodesByKind.get(node.kind) ?? []), node]);
  }

  const activeKinds = kindOrder.filter((kind) => nodesByKind.has(kind));
  const visualNodes = activeKinds.flatMap((kind, columnIndex) => {
    const group = nodesByKind.get(kind) ?? [];
    const x = activeKinds.length === 1 ? 50 : 18 + (columnIndex / (activeKinds.length - 1)) * 64;

    return group.map((node, rowIndex) => ({
      node,
      x,
      y: group.length === 1 ? 50 : 18 + (rowIndex / (group.length - 1)) * 64
    }));
  });
  const nodeLookup = new Map(visualNodes.map((visualNode) => [visualNode.node.id, visualNode]));
  const visualEdges = edges.reduce<VisualGraphEdge[]>((items, edge) => {
    const source = nodeLookup.get(edge.source);
    const target = nodeLookup.get(edge.target);

    if (source && target) {
      items.push({
        id: edge.id,
        label: edge.label,
        source,
        target,
        exceptionRate: edge.exceptionRate
      });
    }

    return items;
  }, []);

  return {
    nodes: visualNodes,
    edges: visualEdges
  };
}

function buildGovernanceRecords(proposal: AutomationProposal, decision: GovernanceDecision) {
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
        comments: "Approved for low-risk requests with exception escalation and audit logging.",
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
        comments: "Rejected pending additional control evidence before execution.",
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
    const providerDetail = providerAuditDetail(input.state.aiProvider ?? createMockAiProviderSnapshot());

    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-proposal-${input.proposal?.version ?? "requested"}`,
        timestamp: "2026-05-16T09:40:00Z",
        actor: "planner_agent",
        action:
          input.state.aiProvider?.lastInvocation?.providerMode === "openai" &&
          input.state.aiProvider.lastInvocation.status === "succeeded"
            ? "Live OpenAI proposal generated"
            : input.state.aiProvider?.lastInvocation?.status === "fallback"
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

function buildFoundationPanels(
  state: PersistedDemoState,
  scenario: DemoScenario,
  ingestion?: IngestionResult,
  proposalRationale?: string
): FoundationPanel[] {
  return [
    {
      title: "Workflow Dataset",
      icon: Database,
      value: state.sampleLoaded ? scenario.label : "Baseline state",
      detail: state.sampleLoaded
        ? scenario.syntheticDataNotice
        : "Load the selected workflow to inspect synthetic traces."
    },
    {
      title: "Work Pattern Clusters",
      icon: Network,
      value: ingestion ? `${ingestion.summary.normalizedItemCount} normalized items` : "Awaiting analysis",
      detail: ingestion
        ? "Repeated patterns, exceptions, and bottlenecks are ready."
        : "Analyze after loading a workflow."
    },
    {
      title: "Work Graph",
      icon: GitBranch,
      value: state.analysisRequested ? "Graph generated" : "Graph canvas ready",
      detail: "Actors, approvals, policy checks, actions, exceptions, and outcomes."
    },
    {
      title: "Agentic Planner",
      icon: Brain,
      value: state.proposalRequested ? "Proposal generated" : state.aiProvider.label,
      detail: proposalRationale ?? `${state.aiProvider.label} generates proposals from graph insights.`
    },
    {
      title: "Governance",
      icon: ShieldCheck,
      value:
        state.governanceDecision === "approved"
          ? "Approved"
          : state.governanceDecision === "rejected"
            ? "Rejected"
            : "Pending",
      detail: "Execution stays blocked until approval."
    },
    {
      title: "Persistence",
      icon: ClipboardCheck,
      value: "Local state saved",
      detail: "Workflow, artifacts, decisions, results, recommendations, and audits persist locally."
    }
  ];
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

export function graphNodeAuditRelevance(kind: string, scenarioLabel: string, bottleneckEvidence?: string) {
  if (kind === "approval") {
    return bottleneckEvidence ?? `${scenarioLabel} keeps approval timing in the audit trail.`;
  }

  if (kind === "exception") {
    return `${scenarioLabel} routes exceptions into review and learning signals.`;
  }

  if (kind === "system") {
    return "System actions are logged for traceability.";
  }

  return `${scenarioLabel} uses this node in the deterministic replay model.`;
}

function governanceDecisionToLabel(decision: GovernanceDecision): string {
  if (decision === "approved") {
    return "Approved";
  }

  if (decision === "rejected") {
    return "Rejected";
  }

  if (decision === "changes_requested") {
    return "Changes requested";
  }

  return "Pending";
}

function topEntry(counts: Record<string, number>): [string, number] | undefined {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
}
