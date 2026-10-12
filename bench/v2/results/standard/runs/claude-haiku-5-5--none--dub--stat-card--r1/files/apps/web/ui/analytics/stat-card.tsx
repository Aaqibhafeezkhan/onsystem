import { Tooltip } from "@dub/ui";
import { cn, nFormatter } from "@dub/utils";
import { ArrowDown, ArrowUp, Info } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  /** Metric label, e.g. "Total clicks". */
  label: string;
  /** Main value. Numbers are formatted with thousands separators. */
  value: number | string;
  /**
   * Change compared to the previous period, as a percentage
   * (e.g. 12.5 for +12.5%, -3 for -3%). Omit to hide the indicator.
   */
  change?: number | null;
  /** Explanation shown in the info tooltip next to the label. */
  tooltip?: ReactNode | string;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  tooltip,
  className,
}: StatCardProps) {
  const displayValue =
    typeof value === "number" ? nFormatter(value, { full: true }) : value;

  const hasChange = typeof change === "number" && Number.isFinite(change);
  const isIncrease = hasChange && change > 0;
  const isDecrease = hasChange && change < 0;

  const ChangeIcon = isIncrease ? ArrowUp : ArrowDown;

  return (
    <div
      className={cn(
        "border-border-default bg-bg-default flex flex-col gap-2 rounded-lg border p-4 sm:rounded-xl",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-content-subtle text-sm font-medium">{label}</span>
        {tooltip && (
          <Tooltip content={tooltip} side="top">
            <button
              type="button"
              aria-label={`About ${label}`}
              className="text-content-muted hover:text-content-default flex size-4 items-center justify-center rounded-full transition-colors"
            >
              <Info className="size-3.5" aria-hidden="true" />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-content-emphasis text-2xl font-semibold tabular-nums">
          {displayValue}
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
            {(isIncrease || isDecrease) && (
              <ChangeIcon className="size-3.5" aria-hidden="true" />
            )}
            <span>
              {isIncrease ? "+" : isDecrease ? "-" : ""}
              {Math.abs(change).toLocaleString(undefined, {
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
