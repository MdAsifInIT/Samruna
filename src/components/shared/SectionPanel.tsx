import type { ReactNode } from "react";

interface SectionPanelProps {
  title: string;
  eyebrow?: string;
  ariaLabel?: string;
  className?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function SectionPanel({ title, eyebrow, ariaLabel, className = "panel", actions, children }: SectionPanelProps) {
  return (
    <section className={className} aria-label={ariaLabel}>
      <div className="graph-header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
