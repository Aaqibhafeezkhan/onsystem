import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import type { ReactNode } from "react";

/**
 * A compact metric summary card.
 * `change` is a percentage change, where positive values indicate an increase.
 */
export function StatCard({
  label,
  value,
  change,
  description,
  comparisonLabel = "vs. previous period",
  className,
}: {
  label: string;
  value: ReactNode;
  change: number;
  description: string;
  comparisonLabel?: string;
  className?: string;
}) {
  const changeColor =
    change > 0
      ? "text-content-success"
      : change < 0
        ? "text-content-error"
        : "text-content-muted";
  const formattedChange = Math.abs(change).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-neutral-600">{label}</p>
        <InfoTooltip content={description} aria-label={`About ${label}`} />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-sm">
        <span className={cn("font-medium", changeColor)}>
          {change > 0 ? "+" : change < 0 ? "−" : ""}
          {formattedChange}%
        </span>
        <span className="text-neutral-500">{comparisonLabel}</span>
      </div>
    </div>
  );
}
