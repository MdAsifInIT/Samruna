import { useEffect, useState } from "react";
import { AppShell } from "./app/AppShell";
import { type ViewId } from "./app/navigation";
import { useWorkGraphDemoController } from "./app/useWorkGraphDemoController";
import { AnalyzeView } from "./features/analyze/AnalyzeView";
import { ObserveView } from "./features/observe/ObserveView";
import { OverviewView } from "./features/overview/OverviewView";
import { ReviewRunView } from "./features/review-run/ReviewRunView";
import { ReviewView } from "./features/review/ReviewView";

export function App() {
  const controller = useWorkGraphDemoController();
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const [workspaceOpen, setWorkspaceOpen] = useState(() => window.location.hash === "#demo");

  useEffect(() => {
    const syncHash = () => setWorkspaceOpen(window.location.hash === "#demo");

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  if (!workspaceOpen) {
    return <LandingPage controller={controller} onLaunch={() => (window.location.hash = "demo")} />;
  }

  return (
    <AppShell activeView={activeView} controller={controller} onViewChange={setActiveView}>
      {renderView(activeView, controller)}
    </AppShell>
  );
}

function LandingPage({
  controller,
  onLaunch
}: {
  controller: ReturnType<typeof useWorkGraphDemoController>;
  onLaunch: () => void;
}) {
  const { aiProvider, currentStage, scenario, workflowStages } = controller;

  return (
    <main className="landing-page">
      <header className="landing-nav" aria-label="Landing navigation">
        <strong>Work Graph Foundry</strong>
        <button type="button" className="landing-nav-button" onClick={onLaunch}>
          Launch demo
        </button>
      </header>

      <section className="landing-hero" aria-label="Product landing page">
        <div className="landing-hero-copy">
          <h1>Work Graph Foundry</h1>
          <p className="landing-copy">
            A governed automation workspace that turns messy work traces into a live graph, a reviewable proposal, and
            a safe simulated run.
          </p>
          <div className="landing-actions">
            <button type="button" className="landing-primary-action" onClick={onLaunch}>
              Launch demo
            </button>
            <a className="landing-link" href="#demo">
              Open workspace
            </a>
          </div>
        </div>

        <ProductPreview
          aiProviderLabel={aiProvider.status.label}
          currentStageLabel={currentStage?.label ?? "Load Workflow"}
          scenarioLabel={scenario.label}
          workflowName={scenario.workflowName}
        />
      </section>

      <section className="landing-section landing-value" aria-label="Product value">
        <h2>From trace evidence to governed execution.</h2>
        <p>
          Work Graph Foundry starts from emails, tickets, approvals, and system logs, then exposes the real workflow
          before any automation runs.
        </p>
      </section>

      <section className="landing-section landing-process" aria-label="How the workflow works">
        {workflowStages.slice(0, 5).map((stage) => (
          <article key={stage.id}>
            <span>{stage.index}</span>
            <strong>{stage.label}</strong>
            <p>{stage.detail}</p>
          </article>
        ))}
      </section>

      <section className="landing-section landing-safety" aria-label="Governance and safety">
        <div>
          <h2>Designed for reviewers, not blind automation.</h2>
          <p>
            Proposals show required data, forbidden data, simulation outcomes, approval state, mock execution output,
            and an audit trail before the run is considered complete.
          </p>
        </div>
        <button type="button" className="landing-primary-action" onClick={onLaunch}>
          Launch demo
        </button>
      </section>
    </main>
  );
}

function ProductPreview({
  aiProviderLabel,
  currentStageLabel,
  scenarioLabel,
  workflowName
}: {
  aiProviderLabel: string;
  currentStageLabel: string;
  scenarioLabel: string;
  workflowName: string;
}) {
  return (
    <aside className="product-preview" aria-label="Work Graph Foundry product preview">
      <div className="preview-topbar">
        <strong>{workflowName}</strong>
        <span>{aiProviderLabel}</span>
      </div>
      <div className="preview-flow" aria-label="Workflow preview flow">
        <div>
          <span>Evidence</span>
          <strong>{scenarioLabel}</strong>
        </div>
        <div>
          <span>Graph</span>
          <strong>Approval bottleneck</strong>
        </div>
        <div>
          <span>Gate</span>
          <strong>{currentStageLabel}</strong>
        </div>
      </div>
      <div className="preview-graph" aria-hidden="true">
        <span data-node="actor">Requester</span>
        <span data-node="approval">Manager approval</span>
        <span data-node="policy">Policy check</span>
        <span data-node="action">Mock task</span>
      </div>
      <div className="preview-footer">
        <span>No external writes</span>
        <span>Audit-ready</span>
      </div>
    </aside>
  );
}

function renderView(activeView: ViewId, controller: ReturnType<typeof useWorkGraphDemoController>) {
  switch (activeView) {
    case "evidence":
      return <ObserveView controller={controller} />;
    case "graph":
      return <AnalyzeView controller={controller} />;
    case "review-run":
      return <ReviewRunView controller={controller} />;
    case "audit":
      return <ReviewView controller={controller} />;
    case "overview":
    default:
      return <OverviewView controller={controller} />;
  }
}
