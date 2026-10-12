import { Badge, CaretUp, InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";

interface StatCardProps {
  /** Metric name shown above the number. */
  label: string;
  /** Current value of the metric, already formatted. */
  value: string | number;
  /** Percentage change versus the previous period. Positive is an increase, negative a decrease. */
  change?: number;
  /** Explanation of the metric, shown in a tooltip from the info icon. */
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
  const isIncrease = hasChange && change >= 0;
  const formattedChange = hasChange
    ? `${isIncrease ? "+" : ""}${change.toFixed(1)}%`
    : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        <InfoTooltip content={tooltip} />
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold text-neutral-900">{value}</span>

        {formattedChange && (
          <Badge variant={isIncrease ? "green" : "red"}>
            <CaretUp
              className={cn("size-3", !isIncrease && "rotate-180")}
              aria-hidden
            />
            {formattedChange}
          </Badge>
        )}
      </div>
    </div>
  );
}
