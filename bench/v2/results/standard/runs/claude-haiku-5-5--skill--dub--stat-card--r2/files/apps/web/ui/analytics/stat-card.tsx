import { Tooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDownRight, ArrowUpRight, HelpCircle } from "lucide-react";

export interface StatCardProps {
  /** Metric label, e.g. "Total clicks". */
  label: string;
  /** Large value shown for the metric. */
  value: string | number;
  /**
   * Change versus the previous period, as a percentage (e.g. 12.5 for +12.5%).
   * Positive values render green, negative values red, zero is neutral.
   */
  change?: number;
  /** Explanation shown in the tooltip next to the label. */
  description?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  description,
  className,
}: StatCardProps) {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const isIncrease = hasChange && change > 0;
  const isDecrease = hasChange && change < 0;

  const ChangeIcon = isDecrease ? ArrowDownRight : ArrowUpRight;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 sm:rounded-xl",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-neutral-600">{label}</span>
        {description && (
          <Tooltip content={description}>
            <button
              type="button"
              aria-label={`About ${label}`}
              className="flex items-center justify-center rounded-md text-neutral-500 transition-colors hover:text-neutral-700"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tabular-nums text-neutral-950">
          {value}
        </span>

        {hasChange && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-sm font-medium tabular-nums",
              isIncrease && "text-green-600",
              isDecrease && "text-red-600",
              !isIncrease && !isDecrease && "text-neutral-500",
            )}
          >
            {(isIncrease || isDecrease) && (
              <ChangeIcon className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {isIncrease ? "+" : isDecrease ? "-" : ""}
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="sr-only">
              {isIncrease
                ? "increase"
                : isDecrease
                  ? "decrease"
                  : "no change"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
