import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  change,
  tooltip,
  className,
}: {
  label: string;
  value: ReactNode;
  /** Percentage change; positive is an increase, negative a decrease. */
  change: number;
  /** Explanation of the metric shown in the info tooltip. */
  tooltip: ReactNode;
  className?: string;
}) {
  const isIncrease = change > 0;
  const isDecrease = change < 0;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-neutral-500">{label}</span>
        <InfoTooltip content={tooltip} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-content-emphasis text-3xl font-semibold">
          {value}
        </span>
        <span
          className={cn(
            "text-sm font-medium",
            isIncrease && "text-green-600",
            isDecrease && "text-red-600",
            !isIncrease && !isDecrease && "text-neutral-500",
          )}
        >
          {isIncrease ? "↑" : isDecrease ? "↓" : ""}{" "}
          {Math.abs(change).toLocaleString("en-US", {
            maximumFractionDigits: 1,
          })}
          %
        </span>
      </div>
    </div>
  );
}
