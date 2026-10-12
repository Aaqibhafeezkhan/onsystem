"use client";

import { Button, CircleInfo, Tooltip, TooltipProvider } from "@dub/ui";

export interface StatCardProps {
  label: string;
  value: number | string;
  /** Percentage change: positive for an increase, negative for a decrease. */
  change: number;
  description: string;
}

export function StatCard({
  label,
  value,
  change,
  description,
}: StatCardProps) {
  const direction = change > 0 ? "Increase" : change < 0 ? "Decrease" : "No change";
  const changeClassName =
    change > 0
      ? "text-content-success"
      : change < 0
        ? "text-content-error"
        : "text-content-subtle";

  return (
    <div className="border-border-subtle bg-bg-default flex min-w-0 flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-content-subtle text-sm font-medium">{label}</p>
        <TooltipProvider>
          <Tooltip content={description}>
            <Button
              type="button"
              variant="outline"
              aria-label={`About ${label}`}
              className="h-8 w-8 shrink-0 p-0"
              icon={<CircleInfo className="size-4" aria-hidden="true" />}
            />
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-content-emphasis break-words text-3xl font-semibold tabular-nums">
        {value}
      </p>
      <p className={`text-sm font-medium tabular-nums ${changeClassName}`}>
        <span className="sr-only">{direction}: </span>
        {change > 0 ? "+" : ""}
        {change}%
      </p>
    </div>
  );
}
