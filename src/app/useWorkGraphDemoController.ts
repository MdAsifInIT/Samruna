import {
  Brain,
  ClipboardCheck,
  Database,
  GitBranch,
  Network,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createAiProvider } from "../ai/providers";
import { recommendLearningUpdate, runApprovedWorkflow } from "../domain/execution";
import { listDemoScenarios, loadDemoScenario, validateDemoFixtures } from "../domain/fixtures";
import { buildWorkGraph } from "../domain/graph";
import { auditFromGovernance, canExecute, createAuditEvent, createGovernanceRecord } from "../domain/governance";
import { ingestWorkTraces } from "../domain/ingestion";
import { detectWorkPatterns } from "../domain/patterns";
import {
  createSeedDemoState,
  exportRunSummary,
  importRunSummary,
  loadPersistedDemoState,
  resetPersistedDemoState,
  saveDemoState,
  type PersistedDemoState
} from "../domain/persistence";
import { generateAutomationProposal } from "../domain/planner";
import { simulateAutomation } from "../domain/simulation";
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

  const aiProvider = useMemo(() => createAiProvider(), []);
  const scenario = useMemo(() => loadDemoScenario(demoState.selectedScenarioId), [demoState.selectedScenarioId]);
  const fixtures = scenario.fixtures;
  const validation = useMemo(() => validateDemoFixtures(fixtures), [fixtures]);
  const ingestion = useMemo(
    () => (demoState.analysisRequested ? ingestWorkTraces(fixtures.rawTraces, fixtures.approvalHistory) : undefined),
    [demoState.analysisRequested, fixtures]
  );
  const patternDetection = useMemo(() => (ingestion ? detectWorkPatterns(ingestion.items) : undefined), [ingestion]);
  const sampleItem = ingestion?.items[0];
  const topPattern = patternDetection?.patterns[0];
  const graph = useMemo(
    () => (ingestion ? buildWorkGraph(ingestion.items, scenario.id, topPattern?.id ?? `scenario-${scenario.id}`) : undefined),
    [ingestion, scenario.id, topPattern?.id]
  );
  const topBottleneck = topPattern
    ? patternDetection?.bottlenecks.find((bottleneck) => bottleneck.patternId === topPattern.id)
    : undefined;
  const topOpportunity = topPattern
    ? patternDetection?.opportunities.find((opportunity) => opportunity.patternId === topPattern.id)
    : undefined;
  const proposal = useMemo(() => pickProposalVersion(demoState.proposals, demoState.selectedProposalId), [
    demoState.proposals,
    demoState.selectedProposalId
  ]);
  const proposalVersions = useMemo(() => sortProposalVersions(demoState.proposals), [demoState.proposals]);
  const proposalGenerationReady = Boolean(topPattern && graph && topBottleneck && topOpportunity);
  const simulation = proposal && ingestion ? simulateAutomation(proposal, ingestion.items) : undefined;
  const governanceDecisionLabel = governanceDecisionToLabel(demoState.governanceDecision);
  const governanceRecords = useMemo(
    () => (proposal ? buildGovernanceRecords(proposal, demoState.governanceDecision) : []),
    [demoState.governanceDecision, proposal]
  );
  const executionReady = proposal ? canExecute(governanceRecords, proposal) : false;
  const executionRun = useMemo(
    () =>
      proposal && demoState.runRequested
        ? runApprovedWorkflow({
            proposal,
            requestTrace: fixtures.newIncomingTrace,
            approved: executionReady
          })
        : undefined,
    [demoState.runRequested, executionReady, fixtures.newIncomingTrace, proposal]
  );
  const executionGateLabel = executionReady
    ? executionRun?.status ?? "Governance approved"
    : demoState.governanceDecision === "rejected"
      ? "Blocked by rejection"
      : "Blocked until approval";
  const executionGateCopy = executionReady
    ? "Governance has opened the gate for this proposal version."
    : demoState.governanceDecision === "rejected"
      ? "This proposal was rejected, so execution stays blocked until a new review approves it."
      : "This proposal is still awaiting approval, so execution stays blocked.";
  const learningRecommendation = useMemo(
    () => (simulation && executionRun ? recommendLearningUpdate({ simulation, execution: executionRun }) : undefined),
    [executionRun, simulation]
  );
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
  const workflowStages = useMemo(
    () =>
      buildWorkflowStages({
        sampleLoaded: demoState.sampleLoaded,
        analysisRequested: demoState.analysisRequested,
        graphReady: Boolean(graph),
        proposalRequested: demoState.proposalRequested,
        governanceDecision: demoState.governanceDecision,
        executionReady,
        executionRun: Boolean(executionRun),
        learningRecommendation: Boolean(learningRecommendation)
      }),
    [
      demoState.analysisRequested,
      demoState.governanceDecision,
      demoState.proposalRequested,
      demoState.sampleLoaded,
      executionReady,
      executionRun,
      graph,
      learningRecommendation
    ]
  );
  const currentStage =
    workflowStages.find((stage) => stage.state === "current") ??
    workflowStages.find((stage) => stage.state === "locked") ??
    workflowStages.find((stage) => stage.state === "available");
  const auditEvents = useMemo(
    () =>
      buildAuditEvents({
        state: demoState,
        scenario,
        proposal,
        ingestion,
        governanceRecords,
        executionStatus: executionRun?.status,
        recommendation: learningRecommendation
      }),
    [demoState, executionRun?.status, governanceRecords, ingestion, learningRecommendation, proposal, scenario]
  );
  const snapshot = useMemo<PersistedDemoState>(
    () => ({
      ...demoState,
      graph,
      selectedProposalId: proposal?.id,
      governanceRecords,
      simulation,
      executionRuns: executionRun ? [executionRun] : [],
      recommendations: learningRecommendation ? [learningRecommendation] : [],
      auditEvents,
      updatedAt: new Date().toISOString()
    }),
    [auditEvents, demoState, executionRun, governanceRecords, graph, learningRecommendation, proposal?.id, simulation]
  );
  const topSystem = ingestion ? topEntry(ingestion.summary.systemCounts) : undefined;
  const foundationPanels = buildFoundationPanels(demoState, scenario, ingestion, proposal?.auditRationale);

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
    saveDemoState(snapshot);
  }, [snapshot]);

  const updateState = (updater: (state: PersistedDemoState) => PersistedDemoState) => {
    setDemoState((current) => updater({ ...current, updatedAt: new Date().toISOString() }));
  };

  const selectScenario = (scenarioId: ScenarioId) => {
    setSelectedGraphNodeId(undefined);
    setSelectedPatternId(undefined);
    setDemoState(createSeedDemoState(scenarioId, new Date().toISOString()));
    setExportText("");
    setImportText("");
    setImportError("");
  };

  const resetDemo = () => {
    setSelectedGraphNodeId(undefined);
    setSelectedPatternId(undefined);
    setDemoState(resetPersistedDemoState(demoState.selectedScenarioId));
    setExportText("");
    setImportText("");
    setImportError("");
  };

  const importSummary = () => {
    try {
      const imported = importRunSummary(importText);
      setSelectedGraphNodeId(undefined);
      setSelectedPatternId(undefined);
      setDemoState(imported);
      saveDemoState(imported);
      setImportError("");
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

    updateState((state) => {
      const version = nextProposalVersion(state.proposals, topPattern.id);
      const nextProposal = generateAutomationProposal({
        pattern: topPattern,
        graph,
        policyRules: fixtures.policyRules,
        bottleneck: topBottleneck,
        opportunity: topOpportunity,
        version,
        changeSummary,
        generatedAt: generatedAtForProposalVersion(version)
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
        simulation: undefined
      };
    });
  };

  const generateProposalFromCurrentState = () => {
    createProposalRevision(
      demoState.proposals.length
        ? "Revision refreshed from the latest graph, policy, and bottleneck inputs."
        : "Initial proposal generated from the graph, policy, and bottleneck inputs."
    );
  };

  const createSelectedProposalRevision = () => {
    if (!proposal) {
      return;
    }

    createProposalRevision(
      `Revision v${nextProposalVersion(demoState.proposals, proposal.patternId)} refreshes governance review from the latest deterministic analysis.`
    );
  };

  const selectProposalVersion = (proposalId: string) => {
    updateState((state) => ({
      ...state,
      selectedProposalId: proposalId,
      governanceDecision: "pending",
      runRequested: false
    }));
  };

  return {
    aiProvider,
    auditEvents,
    channelLabels,
    currentStage,
    demoState,
    executionGateCopy,
    executionGateLabel,
    executionReady,
    executionRun,
    exportText,
    fixtures,
    foundationPanels,
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
    actions: {
      analyzeWorkflow: () =>
        updateState((state) => ({
          ...state,
          analysisRequested: true
        })),
      approveProposal: () =>
        updateState((state) => ({
          ...state,
          governanceDecision: "approved"
        })),
      createSelectedProposalRevision,
      exportSummary: () => setExportText(exportRunSummary(snapshot)),
      generateProposalFromCurrentState,
      importSummary,
      loadSelectedScenario: () =>
        updateState((state) => ({
          ...state,
          sampleLoaded: true
        })),
      rejectProposal: () =>
        updateState((state) => ({
          ...state,
          governanceDecision: "rejected"
        })),
      resetDemo,
      runMockExecution: () =>
        updateState((state) => ({
          ...state,
          runRequested: true
        })),
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
    events.push(
      createAuditEvent({
        id: `audit-${input.scenario.id}-proposal-${input.proposal?.version ?? "requested"}`,
        timestamp: "2026-05-16T09:40:00Z",
        actor: "planner_agent",
        action: "Proposal generated",
        detail: input.proposal
          ? `Proposal v${input.proposal.version} inputs, assumptions, policy checks, actions, and escalations were made reviewable.`
          : "Proposal inputs, assumptions, policy checks, actions, and escalations were made reviewable."
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
      value: state.proposalRequested ? "Proposal generated" : "Deterministic provider default",
      detail: proposalRationale ?? "Automation proposals are generated from graph insights."
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
