"use client";

import { ArrowTrendUp, Badge, InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: number | string;
  changeType?: "increase" | "decrease";
  tooltip?: string | ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType,
  tooltip,
  className,
}: StatCardProps) {
  const isIncrease =
    changeType === "increase" ||
    (typeof change === "number" && change > 0) ||
    (typeof change === "string" && change.startsWith("+"));

  const isDecrease =
    changeType === "decrease" ||
    (typeof change === "number" && change < 0) ||
    (typeof change === "string" && change.startsWith("-"));

  const formattedChange =
    typeof change === "number"
      ? `${change > 0 ? "+" : ""}${change}%`
      : change;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">{label}</span>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
          {value}
        </span>
        {formattedChange != null && (
          <Badge
            variant={isIncrease ? "green" : isDecrease ? "red" : "neutral"}
            className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
          >
            <ArrowTrendUp
              className={cn("size-3 shrink-0", isDecrease && "rotate-180")}
            />
            <span>{formattedChange}</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
