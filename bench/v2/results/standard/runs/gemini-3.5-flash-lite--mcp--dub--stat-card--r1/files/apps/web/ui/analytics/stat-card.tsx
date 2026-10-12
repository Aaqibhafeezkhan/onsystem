import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  change?: number; // e.g. 12.5 for +12.5%, -3.2 for -3.2%
  changeLabel?: ReactNode; // e.g. "vs last period"
  tooltipContent?: ReactNode | string;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel = "vs last period",
  tooltipContent,
  className,
}: StatCardProps) {
  const isIncrease = change !== undefined && change > 0;
  const isDecrease = change !== undefined && change < 0;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">{label}</span>
        {tooltipContent && <InfoTooltip content={tooltipContent} />}
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
            {isIncrease && <ArrowUp className="size-3.5" />}
            {isDecrease && <ArrowDown className="size-3.5" />}
            <span>
              {Math.abs(change)}%
              {changeLabel && (
                <span className="ml-1 font-normal text-neutral-400">
                  {changeLabel}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
