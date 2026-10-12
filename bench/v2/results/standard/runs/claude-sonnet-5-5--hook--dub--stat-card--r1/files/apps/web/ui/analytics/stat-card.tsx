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
  /** Percentage change; positive is an increase, negative is a decrease */
  change?: number;
  /** Explanation of the metric shown in the info tooltip */
  tooltip: string;
  className?: string;
}) {
  const isIncrease = (change ?? 0) > 0;
  const isDecrease = (change ?? 0) < 0;

  return (
    <div
      className={cn(
        "border-border-subtle bg-bg-default flex flex-col gap-2 rounded-xl border p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        <InfoTooltip content={tooltip} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-neutral-800">
          {nFormatter(value, { full: true })}
        </span>
        {change !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-sm font-medium",
              isIncrease && "text-green-600",
              isDecrease && "text-red-600",
              !isIncrease && !isDecrease && "text-neutral-500",
            )}
          >
            <span aria-hidden>{isIncrease ? "↑" : isDecrease ? "↓" : ""}</span>
            {Math.abs(change).toLocaleString("en-US", {
              maximumFractionDigits: 1,
            })}
            %
          </span>
        )}
      </div>
    </div>
  );
}
