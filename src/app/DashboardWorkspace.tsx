import { useState } from "react";
import { AppShell } from "./AppShell";
import { type ViewId } from "./navigation";
import { useWorkGraphDemoController } from "./useWorkGraphDemoController";
import { AnalyzeView } from "../features/analyze/AnalyzeView";
import { ObserveView } from "../features/observe/ObserveView";
import { OverviewView } from "../features/overview/OverviewView";
import { ReviewRunView } from "../features/review-run/ReviewRunView";
import { ReviewView } from "../features/review/ReviewView";

interface DashboardWorkspaceProps {
  onClose: () => void;
}

export function DashboardWorkspace({ onClose }: DashboardWorkspaceProps) {
  const controller = useWorkGraphDemoController();
  const [activeView, setActiveView] = useState<ViewId>("overview");

  return (
    <AppShell activeView={activeView} controller={controller} onViewChange={setActiveView} onClose={onClose}>
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
      return <ReviewView controller={controller} />;
    case "overview":
    default:
      return <OverviewView controller={controller} />;
  }
}
