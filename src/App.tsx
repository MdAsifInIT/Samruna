import { Suspense, lazy, startTransition, useEffect, useState } from "react";
import { LandingPage } from "./features/landing/LandingPage";
import { WorkspaceErrorBoundary } from "./app/WorkspaceErrorBoundary";

const loadDashboardWorkspace = () =>
  import("./app/DashboardWorkspace").then((module) => ({ default: module.DashboardWorkspace }));
const DashboardWorkspace = lazy(loadDashboardWorkspace);

function preloadDashboardWorkspace() {
  void loadDashboardWorkspace();
}

export function App() {
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
        onPrepareWorkspace={preloadDashboardWorkspace}
        onLaunch={() => {
          preloadDashboardWorkspace();
          startTransition(() => {
            window.history.pushState(window.history.state, "", dashboardPath);
            setWorkspaceOpen(true);
          });
        }}
      />
    );
  }

  const closeWorkspace = () => {
    window.history.pushState(window.history.state, "", basePath || "/");
    setWorkspaceOpen(false);
  };

  return (
    <WorkspaceErrorBoundary onBack={closeWorkspace}>
    <Suspense fallback={<main className="workspace-load-state" role="status">Loading demo workspace…</main>}>
      <DashboardWorkspace
        onClose={closeWorkspace}
      />
    </Suspense>
    </WorkspaceErrorBoundary>
  );
}
