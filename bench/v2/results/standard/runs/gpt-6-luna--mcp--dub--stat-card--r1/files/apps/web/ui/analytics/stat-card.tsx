import { InfoTooltip } from "@dub/ui";
import { ArrowTrendUp } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import type { ReactNode } from "react";

export type StatCardProps = {
  label: string;
  value: ReactNode;
  change: number;
  description: string;
  changeLabel?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  change,
  description,
  changeLabel = "vs. previous period",
  className,
}: StatCardProps) {
  const isIncrease = change > 0;
  const isDecrease = change < 0;
  const changeText = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  }).format(Math.abs(change));

  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-5",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-neutral-600">{label}</p>
        <InfoTooltip content={description} aria-label={`About ${label}`} />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <span
          aria-label={`${isIncrease ? "Increase" : isDecrease ? "Decrease" : "Change"} ${changeText}% ${changeLabel}`}
          className={cn(
            "inline-flex items-center gap-0.5 font-medium",
            isIncrease && "text-green-600",
            isDecrease && "text-red-600",
            !isIncrease && !isDecrease && "text-neutral-500",
          )}
        >
          {isIncrease || isDecrease ? (
            <ArrowTrendUp
              aria-hidden="true"
              className={cn("size-3.5", isDecrease && "rotate-180")}
            />
          ) : null}
          {changeText}%
        </span>
        <span className="text-neutral-500">{changeLabel}</span>
      </div>
    </div>
  );
}
