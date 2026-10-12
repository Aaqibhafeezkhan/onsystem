"use client";

import { Button, CircleInfo, Tooltip, TooltipProvider } from "@dub/ui";
import { cn } from "@dub/utils";

export interface StatCardProps {
  label: string;
  value: number | string;
  /** Percentage change from the comparison period; negative values are decreases. */
  change: number;
  /** Explanation of what the metric measures. */
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
  const direction = change > 0 ? "Increase" : change < 0 ? "Decrease" : "No change";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-default p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-content-subtle">{label}</p>
        <TooltipProvider>
          <Tooltip content={description}>
            <Button
              type="button"
              variant="outline"
              aria-label={`About ${label}`}
              icon={<CircleInfo className="size-4" aria-hidden="true" />}
              className="size-6 shrink-0 p-0"
            />
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-3xl font-semibold tabular-nums text-content-emphasis">
        {value}
      </p>
      <p
        aria-label={`${direction}: ${Math.abs(change)}%`}
        className={cn(
          "text-sm font-medium tabular-nums",
          change > 0
            ? "text-content-success"
            : change < 0
              ? "text-content-error"
              : "text-content-subtle",
        )}
      >
        {change > 0 ? "+" : ""}
        {change}%
      </p>
    </div>
  );
}
