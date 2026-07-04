import { ClipboardCheck, Eye, GitBranch, LayoutDashboard, Play, type LucideIcon } from "lucide-react";

export type ViewId = "overview" | "evidence" | "graph" | "review-run" | "audit";

export interface NavigationItem {
  id: ViewId;
  label: string;
  purpose: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  {
    id: "overview",
    label: "Overview",
    purpose: "What pattern was found and what should I do next?",
    icon: LayoutDashboard
  },
  {
    id: "evidence",
    label: "Evidence",
    purpose: "What source proof supports it?",
    icon: Eye
  },
  {
    id: "graph",
    label: "Graph",
    purpose: "Where is the repeated workflow and bottleneck?",
    icon: GitBranch
  },
  {
    id: "review-run",
    label: "Review & Run",
    purpose: "Is the automation safe to approve and run?",
    icon: Play
  },
  {
    id: "audit",
    label: "Audit",
    purpose: "What happened, and can I export or recover it?",
    icon: ClipboardCheck
  }
];
