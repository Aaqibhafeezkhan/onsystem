import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  title?: string;
  label?: string;
  value: ReactNode | string | number;
  change?: number;
  timeframe?: string;
  tooltip?: string | ReactNode;
  className?: string;
}

export function StatCard({
  title,
  label,
  value,
  change,
  timeframe,
  tooltip,
  className,
}: StatCardProps) {
  const metricLabel = title ?? label;
  const isIncrease = change !== undefined && change >= 0;
  const isDecrease = change !== undefined && change < 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500">
          {metricLabel}
        </span>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-semibold tracking-tight text-neutral-900">
          {value}
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isIncrease && "text-emerald-600",
              isDecrease && "text-red-600",
            )}
          >
            {isIncrease ? (
              <ArrowUp className="size-3.5" />
            ) : (
              <ArrowDown className="size-3.5" />
            )}
            <span>{Math.abs(change)}%</span>
            {timeframe && (
              <span className="ml-1 font-normal text-neutral-500">
                {timeframe}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
