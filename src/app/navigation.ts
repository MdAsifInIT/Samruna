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
    purpose: "Executive overview",
    icon: LayoutDashboard
  },
  {
    id: "evidence",
    label: "Evidence",
    purpose: "Intake and evidence",
    icon: Eye
  },
  {
    id: "graph",
    label: "Graph",
    purpose: "Graph and patterns",
    icon: GitBranch
  },
  {
    id: "review-run",
    label: "Review & Run",
    purpose: "Proposal, governance, and simulation",
    icon: Play
  },
  {
    id: "audit",
    label: "Audit",
    purpose: "Audit and recovery",
    icon: ClipboardCheck
  }
];
