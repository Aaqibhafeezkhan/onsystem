import { CaretUp, InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";

export interface StatCardProps {
  /** Short name of the metric, e.g. "Clicks". */
  label: string;
  /** The metric value to display. Formatted as-is. */
  value: string | number;
  /** Percentage change versus the previous period. Omit when unavailable. */
  change?: number;
  /** Explanation of the metric shown in the info tooltip. */
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

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        {description ? <InfoTooltip content={description} /> : null}
      </div>

      <span className="text-2xl font-semibold text-neutral-900">{value}</span>

      {hasChange ? (
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isIncrease && "text-green-600",
            isDecrease && "text-red-600",
            !isIncrease && !isDecrease && "text-neutral-500",
          )}
        >
          {isIncrease || isDecrease ? (
            <CaretUp
              className={cn("h-3 w-3", isDecrease && "rotate-180")}
              aria-hidden="true"
            />
          ) : null}
          <span>
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        </div>
      ) : null}
    </div>
  );
}
