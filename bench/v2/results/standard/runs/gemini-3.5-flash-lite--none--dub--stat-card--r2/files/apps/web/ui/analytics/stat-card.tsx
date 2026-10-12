"use client";

import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import NumberFlow from "@number-flow/react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  label: ReactNode;
  value: number | string | ReactNode;
  change?: number;
  changeLabel?: string;
  tooltip?: ReactNode | string;
  className?: string;
  numberFlow?: boolean;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  tooltip,
  className,
  numberFlow = true,
}: StatCardProps) {
  const isIncrease = change !== undefined && change > 0;
  const isDecrease = change !== undefined && change < 0;
  const isZero = change !== undefined && change === 0;

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-neutral-200 bg-white p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-semibold tracking-tight text-neutral-900">
          {numberFlow && typeof value === "number" ? (
            <NumberFlow value={value} />
          ) : (
            value
          )}
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isIncrease && "text-green-600",
              isDecrease && "text-red-600",
              isZero && "text-neutral-500",
            )}
          >
            {isIncrease && <ArrowUp className="size-3.5" />}
            {isDecrease && <ArrowDown className="size-3.5" />}
            <span>{Math.abs(change)}%</span>
            {changeLabel && (
              <span className="ml-1 font-normal text-neutral-500">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
