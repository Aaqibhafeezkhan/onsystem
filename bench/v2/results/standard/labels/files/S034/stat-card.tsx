import { ArrowTrendUp, Badge, CircleInfo, Tooltip } from "@dub/ui";
import { cn } from "@dub/utils";

export function StatCard({
  label,
  value,
  change,
  tooltip,
  className,
}: {
  label: string;
  value: number | string;
  /** Percentage change; positive is an increase, negative a decrease. */
  change: number;
  /** Explanation of the metric shown in the info tooltip. */
  tooltip: string;
  className?: string;
}) {
  const isIncrease = change >= 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        <Tooltip content={tooltip}>
          <span
            aria-label={`About ${label}`}
            className="flex cursor-help items-center text-neutral-400"
          >
            <CircleInfo className="size-4" />
          </span>
        </Tooltip>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-semibold text-neutral-900">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        <Badge variant={isIncrease ? "green" : "red"} className="gap-1">
          <ArrowTrendUp
            className={cn("size-3", !isIncrease && "-scale-y-100")}
          />
          {isIncrease ? "+" : ""}
          {change}%
        </Badge>
      </div>
    </div>
  );
}
