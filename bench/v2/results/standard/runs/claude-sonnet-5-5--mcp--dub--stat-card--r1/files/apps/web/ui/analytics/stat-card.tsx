import { CircleInfo, Tooltip } from "@dub/ui";
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
  /** Percentage change; positive is an increase, negative a decrease */
  change: number;
  /** Explanation of the metric shown in the info tooltip */
  tooltip: ReactNode;
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
            role="img"
            aria-label={`About ${label}`}
            className="flex cursor-help items-center text-neutral-400 hover:text-neutral-600"
          >
            <CircleInfo className="size-4" />
          </span>
        </Tooltip>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-neutral-900">{value}</span>
        <span
          className={cn(
            "text-sm font-medium",
            isIncrease ? "text-green-600" : "text-red-600",
          )}
        >
          {isIncrease ? "↑" : "↓"} {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
}
