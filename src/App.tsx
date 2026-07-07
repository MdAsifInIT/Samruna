import { useEffect, useState } from "react";
import { AppShell } from "./app/AppShell";
import { type ViewId } from "./app/navigation";
import { useWorkGraphDemoController } from "./app/useWorkGraphDemoController";
import { BrandLogo } from "./components/shared/BrandLogo";
import { AnalyzeView } from "./features/analyze/AnalyzeView";
import { ObserveView } from "./features/observe/ObserveView";
import { OverviewView } from "./features/overview/OverviewView";
import { ReviewRunView } from "./features/review-run/ReviewRunView";
import { ReviewView } from "./features/review/ReviewView";
import { LandingPage } from "./features/landing/LandingPage";
export function App() {
  const controller = useWorkGraphDemoController();
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const basePath = import.meta.env.BASE_URL;
  const dashboardPath = `${basePath}dashboard`.replace("//", "/");

  const [workspaceOpen, setWorkspaceOpen] = useState(() => 
    window.location.pathname === dashboardPath || 
    window.location.pathname === "/dashboard" || 
    window.location.hash === "#demo"
  );

  useEffect(() => {
    const syncWorkspaceRoute = () => {
      const isDashboardRoute = window.location.pathname === dashboardPath || window.location.pathname === "/dashboard";
      const isLegacyDemoHash = window.location.hash === "#demo";

      setWorkspaceOpen(isDashboardRoute || isLegacyDemoHash);

      if (isLegacyDemoHash) {
        window.history.replaceState(window.history.state, "", dashboardPath);
      }
    };

    syncWorkspaceRoute();
    window.addEventListener("popstate", syncWorkspaceRoute);

    return () => window.removeEventListener("popstate", syncWorkspaceRoute);
  }, []);

  if (!workspaceOpen) {
    return (
      <LandingPage
        aiProviderLabel={controller.aiProvider.status.label}
        scenarioLabel={controller.scenario.label}
        scenarioName={controller.scenario.workflowName}
        onLaunch={() => {
          const basePath = import.meta.env.BASE_URL;
          const dashboardPath = `${basePath}dashboard`.replace("//", "/");
          window.history.pushState(window.history.state, "", dashboardPath);
          setWorkspaceOpen(true);
        }}
      />
    );
  }

  return (
    <AppShell activeView={activeView} controller={controller} onViewChange={setActiveView}>
      {renderView(activeView, controller, setActiveView)}
    </AppShell>
  );
}



function renderView(
  activeView: ViewId,
  controller: ReturnType<typeof useWorkGraphDemoController>,
  onViewChange: (viewId: ViewId) => void
) {
  switch (activeView) {
    case "evidence":
      return <ObserveView controller={controller} />;
    case "graph":
      return <AnalyzeView controller={controller} />;
    case "review-run":
      return <ReviewRunView controller={controller} />;
    case "audit":
      return <ReviewView controller={controller} onReset={() => onViewChange("overview")} />;
    case "overview":
    default:
      return <OverviewView controller={controller} />;
  }
}
