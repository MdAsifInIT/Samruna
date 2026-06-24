import { useState } from "react";
import { AppShell } from "./app/AppShell";
import { type ViewId } from "./app/navigation";
import { useWorkGraphDemoController } from "./app/useWorkGraphDemoController";
import { AnalyzeView } from "./features/analyze/AnalyzeView";
import { ExecuteView } from "./features/execute/ExecuteView";
import { GovernView } from "./features/govern/GovernView";
import { ObserveView } from "./features/observe/ObserveView";
import { OverviewView } from "./features/overview/OverviewView";
import { PlanView } from "./features/plan/PlanView";
import { ReviewView } from "./features/review/ReviewView";

export function App() {
  const controller = useWorkGraphDemoController();
  const [activeView, setActiveView] = useState<ViewId>("overview");

  return (
    <AppShell activeView={activeView} controller={controller} onViewChange={setActiveView}>
      {renderView(activeView, controller)}
    </AppShell>
  );
}

function renderView(activeView: ViewId, controller: ReturnType<typeof useWorkGraphDemoController>) {
  switch (activeView) {
    case "observe":
      return <ObserveView controller={controller} />;
    case "analyze":
      return <AnalyzeView controller={controller} />;
    case "plan":
      return <PlanView controller={controller} />;
    case "govern":
      return <GovernView controller={controller} />;
    case "execute":
      return <ExecuteView controller={controller} />;
    case "review":
      return <ReviewView controller={controller} />;
    case "overview":
    default:
      return <OverviewView controller={controller} />;
  }
}
