import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export interface StatCardProps {
  /** Metric name shown above the number, e.g. "Clicks". */
  label: string;
  /** The metric value shown large. */
  value: number | string;
  /**
   * Percentage change versus the previous period, e.g. 12.5 or -3.2.
   * Positive values render green (increase), negative values red (decrease).
   * Omit to hide the change indicator.
   */
  change?: number;
  /** Explanation shown in the tooltip of the info icon. */
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

  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value;

  const formattedChange = hasChange
    ? `${Math.abs(change).toLocaleString(undefined, {
        maximumFractionDigits: 1,
      })}%`
    : null;

  const ChangeIcon = isIncrease ? ArrowUp : isDecrease ? ArrowDown : Minus;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 sm:rounded-xl",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-neutral-600">{label}</span>
        <InfoTooltip content={tooltip} />
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold text-neutral-900">
          {formattedValue}
        </span>

        {hasChange && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-sm font-medium",
              isIncrease && "text-green-600",
              isDecrease && "text-red-600",
              !isIncrease && !isDecrease && "text-neutral-500",
            )}
          >
            <ChangeIcon className="h-3.5 w-3.5" aria-hidden />
            {formattedChange}
            <span className="sr-only">
              {isIncrease
                ? " increase"
                : isDecrease
                  ? " decrease"
                  : " no change"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
