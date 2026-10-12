import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number | ReactNode;
  change?: number | string;
  changeType?: "increase" | "decrease" | "neutral";
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
    (typeof change === "string" &&
      (change.startsWith("+") || parseFloat(change) > 0));

  const isDecrease =
    changeType === "decrease" ||
    (typeof change === "number" && change < 0) ||
    (typeof change === "string" && change.startsWith("-"));

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-3xl font-semibold tracking-tight text-neutral-900">
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
            {isIncrease && <TrendingUp className="size-3.5 shrink-0" />}
            {isDecrease && <TrendingDown className="size-3.5 shrink-0" />}
            <span>
              {typeof change === "number"
                ? `${change > 0 ? "+" : ""}${change}%`
                : change}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
