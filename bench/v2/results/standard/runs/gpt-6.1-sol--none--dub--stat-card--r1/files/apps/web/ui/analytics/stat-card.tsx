"use client";

import { Tooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: number | string;
  /** Signed percentage change: 12.5 displays as +12.5%. */
  change: number;
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
  const ChangeIcon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
  const direction = change > 0 ? "Increase" : change < 0 ? "Decrease" : "No change";

  return (
    <div
      className={cn(
        "border-border-default bg-bg-default flex min-w-0 flex-col gap-3 rounded-xl border p-4",
        className,
      )}
    >
      <div className="text-content-subtle flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Tooltip content={tooltip}>
          <button
            type="button"
            aria-label={`About ${label}`}
            className="hover:text-content-emphasis focus-visible:ring-border-emphasis shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <Info className="size-4" aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
      <p className="text-content-emphasis break-words text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <p
        className={cn(
          "flex items-center gap-1 text-sm font-medium tabular-nums",
          change > 0
            ? "text-green-600"
            : change < 0
              ? "text-red-600"
              : "text-content-subtle",
        )}
      >
        <ChangeIcon className="size-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">{direction}: </span>
        <span>
          {change > 0 ? "+" : ""}
          {change}%
        </span>
      </p>
    </div>
  );
}
