import { CaretUp, InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";

export interface StatCardProps {
  /** Metric name shown above the value */
  label: string;
  /** Preformatted metric value, e.g. "12,345" or "$1.2k" */
  value: string;
  /** Change versus the previous period, as a percentage (e.g. 12.5 or -3) */
  change?: number;
  /** Explanation of the metric shown in the info tooltip */
  description: string;
}

export function StatCard({ label, value, change, description }: StatCardProps) {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const isIncrease = hasChange && change > 0;
  const isDecrease = hasChange && change < 0;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-neutral-600">{label}</span>
        <InfoTooltip content={description} />
      </div>

      <span className="text-2xl font-semibold tabular-nums text-neutral-900">
        {value}
      </span>

      {hasChange ? (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium tabular-nums",
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
            {isIncrease ? "+" : ""}
            {change}%
          </span>
          <span className="sr-only">
            {isIncrease ? "increase" : isDecrease ? "decrease" : "no change"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
