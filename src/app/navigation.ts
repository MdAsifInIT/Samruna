import {
  ClipboardCheck,
  Eye,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Play,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";

export type ViewId = "overview" | "observe" | "analyze" | "plan" | "govern" | "execute" | "review";

export interface NavigationItem {
  id: ViewId;
  label: string;
  purpose: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  {
    id: "overview",
    label: "Command Center",
    purpose: "Executive overview",
    icon: LayoutDashboard
  },
  {
    id: "observe",
    label: "Observe",
    purpose: "Intake and evidence",
    icon: Eye
  },
  {
    id: "analyze",
    label: "Analyze",
    purpose: "Graph and patterns",
    icon: GitBranch
  },
  {
    id: "plan",
    label: "Plan",
    purpose: "Proposal planning",
    icon: ListChecks
  },
  {
    id: "govern",
    label: "Govern",
    purpose: "Approval gate",
    icon: ShieldCheck
  },
  {
    id: "execute",
    label: "Execute",
    purpose: "Simulation run",
    icon: Play
  },
  {
    id: "review",
    label: "Review",
    purpose: "Audit and recovery",
    icon: ClipboardCheck
  }
];
