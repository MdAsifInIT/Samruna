interface EmptyStateProps {
  title: string;
  action: string;
}

export function EmptyState({ title, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{action}</p>
    </div>
  );
}
