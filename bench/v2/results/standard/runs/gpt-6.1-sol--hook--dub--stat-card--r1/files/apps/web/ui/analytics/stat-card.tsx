"use client";

import { Button, Tooltip } from "@dub/ui";
import { CircleInfo } from "@dub/ui/icons";
import { cn } from "@dub/utils";

export interface StatCardProps {
  label: string;
  value: number | string;
  /** Signed percentage change: positive for an increase, negative for a decrease. */
  change: number;
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
  return (
    <div
      className={cn(
        "border-border-subtle bg-bg-default flex flex-col gap-3 rounded-xl border p-4",
        className,
      )}
    >
      <div className="text-content-subtle flex items-center gap-2 text-sm font-medium">
        <span>{label}</span>
        <Tooltip content={description}>
          <Button
            type="button"
            variant="outline"
            aria-label={`About ${label}`}
            icon={<CircleInfo className="size-4" aria-hidden="true" />}
            className="text-content-muted focus-visible:ring-border-default size-6 shrink-0 p-0 focus-visible:ring-2 focus-visible:ring-offset-2"
          />
        </Tooltip>
      </div>
      <p className="text-content-default text-3xl font-semibold tabular-nums tracking-tight">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      <p
        className={cn(
          "text-sm font-medium tabular-nums",
          change > 0
            ? "text-content-success"
            : change < 0
              ? "text-content-error"
              : "text-content-muted",
        )}
      >
        <span className="sr-only">
          {change > 0 ? "Increase of " : change < 0 ? "Decrease of " : "No change: "}
        </span>
        {change > 0 ? "+" : change < 0 ? "−" : ""}
        {Math.abs(change)}%
      </p>
    </div>
  );
}
