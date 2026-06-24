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
    purpose: "Executive and operations overview",
    icon: LayoutDashboard
  },
  {
    id: "observe",
    label: "Observe",
    purpose: "Intake and evidence visibility",
    icon: Eye
  },
  {
    id: "analyze",
    label: "Analyze",
    purpose: "Work graph and pattern discovery",
    icon: GitBranch
  },
  {
    id: "plan",
    label: "Plan",
    purpose: "Proposal generation and change planning",
    icon: ListChecks
  },
  {
    id: "govern",
    label: "Govern",
    purpose: "Simulation, compliance, and approval",
    icon: ShieldCheck
  },
  {
    id: "execute",
    label: "Execute",
    purpose: "Simulated execution and workflow operations",
    icon: Play
  },
  {
    id: "review",
    label: "Review",
    purpose: "Audit, export, import, and recovery",
    icon: ClipboardCheck
  }
];
