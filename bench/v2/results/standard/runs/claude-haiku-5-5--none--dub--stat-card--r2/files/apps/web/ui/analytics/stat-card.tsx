import { Tooltip } from "@dub/ui";
import { CircleInfo } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export interface StatCardProps {
  /** Metric label, e.g. "Clicks". */
  label: string;
  /** Large value to display. Numbers are formatted with en-US separators. */
  value: number | string;
  /**
   * Percentage change versus the previous period (e.g. 12.5 for +12.5%).
   * Positive values render green, negative values red. Omit or pass `null`
   * to hide the change indicator.
   */
  change?: number | null;
  /** Explanation shown in the tooltip next to the info icon. */
  tooltip?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  tooltip,
  className,
}: StatCardProps) {
  const formattedValue =
    typeof value === "number" ? value.toLocaleString("en-US") : value;

  const hasChange = typeof change === "number" && Number.isFinite(change);
  const isIncrease = hasChange && change > 0;
  const isDecrease = hasChange && change < 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 sm:rounded-xl",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-content-subtle">{label}</span>
        {tooltip && (
          <Tooltip content={tooltip}>
            <button
              type="button"
              aria-label={`About ${label}`}
              className="flex items-center text-neutral-400 transition-colors hover:text-neutral-600 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              <CircleInfo className="size-3.5" aria-hidden="true" />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-content-emphasis">
          {formattedValue}
        </span>

        {hasChange && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
              isIncrease && "text-content-success",
              isDecrease && "text-content-error",
              !isIncrease && !isDecrease && "text-content-subtle",
            )}
          >
            {isIncrease && <ArrowUpRight className="size-3.5" aria-hidden="true" />}
            {isDecrease && (
              <ArrowDownRight className="size-3.5" aria-hidden="true" />
            )}
            <span>
              {isIncrease ? "+" : isDecrease ? "−" : ""}
              {Math.abs(change).toLocaleString("en-US", {
                maximumFractionDigits: 1,
              })}
              %
            </span>
            <span className="sr-only">
              {isIncrease ? "increase" : isDecrease ? "decrease" : "no change"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
