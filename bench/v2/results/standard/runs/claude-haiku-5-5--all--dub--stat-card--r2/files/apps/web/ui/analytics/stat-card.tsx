import { Badge, CaretUp, InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";

export interface StatCardProps {
  /** Metric name shown above the number. */
  label: string;
  /** Current value of the metric. */
  value: number | string;
  /** Percentage change versus the previous period (e.g. 12.5 for +12.5%). */
  change?: number;
  /** Explanation of the metric, shown in a tooltip from the info icon. */
  description: string;
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

  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value;

  const formattedChange = hasChange
    ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
    : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-neutral-600">{label}</span>
        <InfoTooltip
          content={description}
          aria-label={`About ${label}`}
          side="top"
        />
      </div>

      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold tabular-nums text-neutral-900">
          {formattedValue}
        </span>

        {formattedChange && (
          <Badge
            variant={isIncrease ? "green" : isDecrease ? "red" : "neutral"}
            className="gap-1"
          >
            <CaretUp
              aria-hidden="true"
              className={cn("h-3 w-3", isDecrease && "rotate-180")}
            />
            {formattedChange}
          </Badge>
        )}
      </div>
    </div>
  );
}
