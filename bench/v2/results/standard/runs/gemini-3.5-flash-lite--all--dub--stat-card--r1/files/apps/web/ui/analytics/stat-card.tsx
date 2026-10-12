"use client";

import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  /**
   * The label describing the metric.
   */
  label: ReactNode;
  /**
   * The large number or value to display.
   */
  value: ReactNode;
  /**
   * The change value or percentage (e.g., "+12%", "-5%", or number).
   */
  change?: ReactNode | string | number;
  /**
   * Whether the change is an increase ("increase") or decrease ("decrease").
   * If not provided, it can be inferred if change is a positive/negative number or string.
   */
  trend?: "increase" | "decrease";
  /**
   * Tooltip description explaining the metric.
   */
  info?: ReactNode | string;
  /**
   * Additional CSS classes for the card wrapper.
   */
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  trend,
  info,
  className,
}: StatCardProps) {
  const isIncrease =
    trend === "increase" ||
    (typeof change === "number" && change > 0) ||
    (typeof change === "string" && !change.startsWith("-") && change !== "0");

  const isDecrease =
    trend === "decrease" ||
    (typeof change === "number" && change < 0) ||
    (typeof change === "string" && change.startsWith("-"));

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-neutral-500">{label}</span>
        {info && <InfoTooltip content={info} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-neutral-900">
          {value}
        </span>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isIncrease && "text-green-600",
              isDecrease && "text-red-600",
              !isIncrease && !isDecrease && "text-neutral-500",
            )}
          >
            {isIncrease && <TrendingUp className="size-3.5" />}
            {isDecrease && <TrendingDown className="size-3.5" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
