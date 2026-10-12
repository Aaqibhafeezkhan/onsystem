import { InfoTooltip } from "@dub/ui";
import type { ReactNode } from "react";

export type StatCardProps = {
  label: string;
  value: ReactNode;
  change: number;
  description: string;
};

export function StatCard({ label, value, change, description }: StatCardProps) {
  const isIncrease = change > 0;
  const isDecrease = change < 0;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-default p-4">
      <div className="flex items-center gap-1.5">
        <span className="text-content-subtle text-sm font-medium">{label}</span>
        <InfoTooltip content={description} aria-label={`About ${label}`} />
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-content-default text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        <span
          className={`inline-flex items-center gap-0.5 text-sm font-medium tabular-nums ${
            isIncrease
              ? "text-content-success"
              : isDecrease
                ? "text-content-error"
                : "text-content-muted"
          }`}
          aria-label={`${Math.abs(change)}% ${isIncrease ? "increase" : isDecrease ? "decrease" : "change"}`}
        >
          <span aria-hidden="true">{isIncrease ? "↑" : isDecrease ? "↓" : "–"}</span>
          {change > 0 ? "+" : ""}
          {change}%
        </span>
      </div>
    </div>
  );
}
