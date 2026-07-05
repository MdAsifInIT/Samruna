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
  const { aiProvider, scenario } = controller;

  return (
    <main className="landing-page">
      <header className="landing-nav" aria-label="Landing navigation">
        <strong>Work Graph Foundry</strong>
      </header>

      <section className="landing-hero" aria-label="Product landing page">
        <div className="landing-hero-copy">
          <h1>Work Graph Foundry</h1>
          <p className="landing-copy">
            Turn hidden work patterns into governed automation - with proof it works before anything runs.
          </p>
          <div className="landing-actions">
            <button type="button" className="landing-primary-action" onClick={onLaunch}>
              Launch
            </button>
          </div>
        </div>

        <ProductPreview
          aiProviderLabel={aiProvider.status.label}
          scenarioLabel={scenario.label}
          scenarioName={scenario.workflowName}
          workflowName={scenario.workflowName}
        />
      </section>

      <section className="landing-section landing-process" aria-label="Landing workflow blocks">
        <article>
          <span>01</span>
          <strong>Pattern discovery</strong>
          <p>Surface repeated work, bottlenecks, and exceptions from customer context and operational traces.</p>
        </article>
        <article>
          <span>02</span>
          <strong>Governed proposal</strong>
          <p>Create a reviewable proposal with policy context, assumptions, and explicit approval gates.</p>
        </article>
        <article>
          <span>03</span>
          <strong>Safe execution</strong>
          <p>Run only after approval, with bounded actions, logs, and a reversible path back.</p>
        </article>
      </section>

      <section className="landing-section landing-proof" aria-label="Impact evidence">
        <div>
          <strong>Proven impact from real workflow data.</strong>
          <p>Measured against synthetic enterprise traces - ready for production validation.</p>
          <div className="impact-metrics" aria-label="Key impact metrics">
            <div>
              <strong>62h to 2h</strong>
              <span>Approval time</span>
            </div>
            <div>
              <strong>12% to 0%</strong>
              <span>Exception rate</span>
            </div>
            <div>
              <strong>4 / 4</strong>
              <span>Validations passed</span>
            </div>
            <div>
              <strong>60h</strong>
              <span>Delay avoided</span>
            </div>
          </div>
        </div>
        <button type="button" className="landing-secondary-action" onClick={onLaunch}>
          Open workspace
        </button>
      </section>
    </main>
  );
}

function ProductPreview({
  aiProviderLabel,
  scenarioLabel,
  scenarioName,
  workflowName
}: {
  aiProviderLabel: string;
  scenarioLabel: string;
  scenarioName: string;
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
          <span>Pattern found</span>
          <strong>{scenarioLabel}</strong>
        </div>
        <div>
          <span>Proposal ready</span>
          <strong>Governed proposal</strong>
        </div>
        <div>
          <span>Approved run</span>
          <strong>Safe execution</strong>
        </div>
      </div>
      <div className="preview-path" aria-label="Connected automation path">
        <span>Pattern found</span>
        <i aria-hidden="true" />
        <span>Proposal ready</span>
        <i aria-hidden="true" />
        <span>Approved run</span>
      </div>
      <div className="preview-graph" aria-hidden="true">
        <span data-node="actor">{scenarioName}</span>
        <span data-node="approval">Pattern found</span>
        <span data-node="policy">Proposal ready</span>
        <span data-node="action">Approved run</span>
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
