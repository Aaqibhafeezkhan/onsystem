import { ButtonTooltip, CaretUp, CircleInfo } from "@dub/ui";
import { cn } from "@dub/utils";

export interface StatCardProps {
  /** Metric label, e.g. "Total clicks". */
  label: string;
  /** Current value of the metric. */
  value: number | string;
  /** Percentage change versus the previous period. Positive is an increase, negative a decrease. */
  change?: number;
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
  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value;

  const isIncrease = change !== undefined && change > 0;
  const isDecrease = change !== undefined && change < 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-neutral-500">
          {label}
        </span>
        <ButtonTooltip
          aria-label={`About ${label}`}
          tooltipProps={{ content: tooltip, side: "top" }}
        >
          <CircleInfo className="h-4 w-4" />
        </ButtonTooltip>
      </div>

      <span className="text-2xl font-semibold text-neutral-900">
        {formattedValue}
      </span>

      {change !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isIncrease && "text-green-600",
            isDecrease && "text-red-600",
            !isIncrease && !isDecrease && "text-neutral-500",
          )}
        >
          <CaretUp
            aria-hidden
            className={cn("h-3 w-3", isDecrease && "rotate-180")}
          />
          <span>
            {isIncrease ? "+" : isDecrease ? "-" : ""}
            {Math.abs(change).toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}
            %
          </span>
        </div>
      )}
    </div>
  );
}
