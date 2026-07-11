import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onBack: () => void;
}

interface State {
  failed: boolean;
}

export class WorkspaceErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Workspace chunk failed to load", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="workspace-load-state" role="alert">
        <h1>Workspace could not load</h1>
        <p>The demo workspace did not finish loading. Retry the page or return to the landing screen.</p>
        <div>
          <button type="button" onClick={() => window.location.reload()}>Retry workspace</button>
          <button type="button" onClick={this.props.onBack}>Back to landing</button>
        </div>
      </main>
    );
  }
}
