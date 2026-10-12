import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

export interface StatCardProps {
  /** Metric label, e.g. "Total clicks". */
  label: string;
  /** Large value to display. Pre-format numbers before passing them in. */
  value: string | number;
  /**
   * Change relative to the previous period, as a percentage
   * (e.g. 12.5 for +12.5%). Positive values render green, negative values red.
   * Omit or pass `null` to hide the indicator.
   */
  change?: number | null;
  /** Explanation of the metric shown in a tooltip on the info icon. */
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
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const isIncrease = hasChange && change > 0;
  const isDecrease = hasChange && change < 0;

  const formattedChange = hasChange
    ? `${Math.abs(change).toLocaleString("en-US", {
        maximumFractionDigits: 1,
      })}%`
    : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border-default bg-bg-default p-4 sm:rounded-xl",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="truncate text-sm font-medium text-content-subtle">
          {label}
        </span>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-2xl font-semibold tabular-nums text-content-emphasis">
          {value}
        </span>

        {hasChange && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-sm font-medium tabular-nums",
              isIncrease && "text-content-success",
              isDecrease && "text-content-error",
              !isIncrease && !isDecrease && "text-content-subtle",
            )}
          >
            {isIncrease && <ArrowUp className="size-3.5" aria-hidden="true" />}
            {isDecrease && <ArrowDown className="size-3.5" aria-hidden="true" />}
            <span>
              {formattedChange}
              <span className="sr-only">
                {isIncrease
                  ? " increase"
                  : isDecrease
                    ? " decrease"
                    : " no change"}
              </span>
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
