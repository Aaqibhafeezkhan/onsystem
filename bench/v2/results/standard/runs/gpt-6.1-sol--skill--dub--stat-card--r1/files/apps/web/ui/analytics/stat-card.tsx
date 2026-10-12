"use client";

import { Button, Tooltip, TooltipProvider } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp, Info, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  /** A numeric metric or a preformatted value (for example, "$1,234"). */
  value: number | string;
  /** Percentage change: positive for an increase, negative for a decrease. */
  change: number;
  /** Explains what the metric measures. */
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
  const ChangeIcon = change > 0 ? ArrowUp : change < 0 ? ArrowDown : Minus;
  const changeLabel =
    change > 0 ? "Increase" : change < 0 ? "Decrease" : "No change";

  return (
    <div
      className={cn(
        "border-border-subtle bg-bg-default flex min-w-0 flex-col gap-3 rounded-xl border p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-content-subtle text-sm font-medium">{label}</p>
        <TooltipProvider>
          <Tooltip content={tooltip}>
            <Button
              type="button"
              variant="outline"
              aria-label={`About ${label}`}
              icon={<Info className="size-4" aria-hidden="true" />}
              className="size-6 shrink-0 p-0"
            />
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-content-emphasis break-words text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <p
        className={cn(
          "flex items-center gap-1 text-sm font-medium tabular-nums",
          change > 0
            ? "text-content-success"
            : change < 0
              ? "text-content-error"
              : "text-content-subtle",
        )}
      >
        <ChangeIcon className="size-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">{changeLabel}: </span>
        <span>{Math.abs(change)}%</span>
      </p>
    </div>
  );
}
