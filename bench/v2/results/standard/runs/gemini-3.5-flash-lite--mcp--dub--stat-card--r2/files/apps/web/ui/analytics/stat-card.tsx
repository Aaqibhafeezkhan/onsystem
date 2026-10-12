"use client";

import { InfoTooltip } from "@dub/ui";
import { ArrowUpRight } from "@dub/ui";
import { cn } from "@dub/utils";
import { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  tooltip?: ReactNode;
  icon?: React.ElementType;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  tooltip,
  icon: Icon,
  className,
}: StatCardProps) {
  const isIncrease = change !== undefined && change > 0;
  const isDecrease = change !== undefined && change < 0;

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-neutral-500" />}
          <span className="text-sm font-medium text-neutral-500">{label}</span>
        </div>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-semibold tracking-tight text-neutral-900">
          {value}
        </div>

        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isIncrease && "text-green-600",
              isDecrease && "text-red-600",
              !isIncrease && !isDecrease && "text-neutral-500",
            )}
          >
            {isIncrease && <ArrowUpRight className="size-3.5" />}
            {isDecrease && <ArrowUpRight className="size-3.5 rotate-90" />}
            <span>
              {isIncrease ? "+" : ""}
              {change}%
            </span>
            {changeLabel && (
              <span className="font-normal text-neutral-400">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
