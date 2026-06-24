import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  children: ReactNode;
}

export function ToolbarButton({ icon: Icon, children, ...buttonProps }: ToolbarButtonProps) {
  return (
    <button type="button" {...buttonProps}>
      <Icon size={18} />
      <span>{children}</span>
    </button>
  );
}
