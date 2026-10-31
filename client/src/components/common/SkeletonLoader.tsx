import React from 'react';

export const SkeletonLoader: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-3 p-4">
      <div className="h-8 w-1/4 rounded-lg bg-bordergrey/60 animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-full rounded-lg bg-bordergrey/40 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
};
