interface StatusPillProps {
  children: string;
  tone?: "neutral" | "good" | "warn" | "blocked";
}

export function StatusPill({ children, tone = "neutral" }: StatusPillProps) {
  return (
    <strong className="status-pill" data-tone={tone}>
      {children}
    </strong>
  );
}
