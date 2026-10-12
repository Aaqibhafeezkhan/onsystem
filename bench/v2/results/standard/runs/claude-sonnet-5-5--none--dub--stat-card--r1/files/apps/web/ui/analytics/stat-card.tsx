import { InfoTooltip } from "@dub/ui";
import { cn, nFormatter } from "@dub/utils";

export function StatCard({
  label,
  value,
  change,
  tooltip,
  className,
}: {
  label: string;
  value: number;
  /** Percentage change versus the previous period. Positive = increase, negative = decrease. */
  change?: number | null;
  /** Explanation of the metric shown in the info tooltip. */
  tooltip: string;
  className?: string;
}) {
  const hasChange = typeof change === "number" && !isNaN(change);
  const isIncrease = hasChange && change > 0;
  const isDecrease = hasChange && change < 0;

  return (
    <div
      className={cn(
        "border-border-subtle bg-bg-default flex flex-col gap-1 rounded-xl border p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-content-subtle text-sm font-medium">{label}</span>
        <InfoTooltip content={tooltip} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-content-emphasis text-3xl font-semibold">
          {nFormatter(value, { full: true })}
        </span>
        {hasChange && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
              isIncrease && "bg-green-100 text-green-700",
              isDecrease && "bg-red-100 text-red-700",
              !isIncrease && !isDecrease && "bg-neutral-100 text-neutral-600",
            )}
          >
            <span aria-hidden>{isIncrease ? "↑" : isDecrease ? "↓" : ""}</span>
            {Math.abs(change).toFixed(1)}%
            <span className="sr-only">
              {isIncrease ? "increase" : isDecrease ? "decrease" : "no change"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
