import React from 'react';

interface EmptyStateProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const titleId = `empty-state-title-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const descId = `empty-state-desc-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 id={titleId} className="text-lg font-medium mb-2">
        {title}
      </h2>
      <p id={descId} className="text-sm text-muted-foreground mb-6">
        {description}
      </p>
      {action && (
        <div aria-describedby={descId}>{action}</div>
      )}
    </div>
  );
}
