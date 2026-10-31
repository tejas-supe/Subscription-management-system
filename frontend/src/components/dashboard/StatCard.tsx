import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  subtext?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  trendPositive = true,
  subtext,
  icon,
  highlight = false,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-white p-5 transition-all duration-200 hover:shadow-card ${
        highlight
          ? 'border-chartreuse/40 bg-gradient-to-br from-white to-chartreuse-glow/30'
          : 'border-bordergrey shadow-subtle'
      }`}
    >
      {highlight && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-chartreuse" />
      )}

      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-slategrey">
          {title}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ivory text-forest border border-bordergrey">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight text-obsidian tabular-nums">
          {value}
        </span>
      </div>

      {(trend || subtext) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                trendPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {trendPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {trend}
            </span>
          )}
          {subtext && <span className="text-slategrey">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
