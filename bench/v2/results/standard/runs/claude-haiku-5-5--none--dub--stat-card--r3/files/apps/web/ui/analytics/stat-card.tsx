import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export interface StatCardProps {
  /** Metric label, e.g. "Total clicks". */
  label: string;
  /** Large value displayed for the metric. Numbers are formatted with separators. */
  value: number | string;
  /**
   * Change relative to the previous period, as a percentage (e.g. 12.5 for +12.5%).
   * Positive values render green, negative values red. Omit when there is no comparison.
   */
  change?: number | null;
  /** Explanation of the metric shown in the info tooltip. */
  tooltip: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  tooltip,
  className,
}: StatCardProps) {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const isIncrease = hasChange && change > 0;
  const isDecrease = hasChange && change < 0;

  const ChangeIcon = isIncrease
    ? TrendingUp
    : isDecrease
      ? TrendingDown
      : Minus;

  const formattedValue =
    typeof value === "number" ? value.toLocaleString("en-US") : value;

  const formattedChange = hasChange
    ? `${isIncrease ? "+" : ""}${change.toLocaleString("en-US", {
        maximumFractionDigits: 1,
      })}%`
    : null;

  return (
    <div
      className={cn(
        "bg-default border-border-subtle flex flex-col gap-2 rounded-lg border p-4 sm:rounded-xl",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-content-subtle text-sm font-medium">{label}</span>
        <InfoTooltip content={tooltip} />
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-content-emphasis text-3xl font-semibold tabular-nums">
          {formattedValue}
        </span>

        {formattedChange !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium tabular-nums",
              isIncrease && "text-content-success",
              isDecrease && "text-content-error",
              !isIncrease && !isDecrease && "text-content-subtle",
            )}
          >
            <ChangeIcon className="size-3.5" aria-hidden="true" />
            {formattedChange}
          </span>
        )}
      </div>
    </div>
  );
}
