import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ivory text-forest border border-bordergrey shadow-subtle mb-4">
        <Icon className="h-7 w-7 text-forest" />
      </div>
      <h3 className="text-base font-semibold text-obsidian">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slategrey">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-obsidian px-4 py-2 text-sm font-semibold text-white shadow-subtle hover:bg-forest transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
