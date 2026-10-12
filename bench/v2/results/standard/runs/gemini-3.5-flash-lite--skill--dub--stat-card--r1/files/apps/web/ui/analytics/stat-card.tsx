import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  label: string | ReactNode;
  value: string | number | ReactNode;
  change?: number | string;
  changeType?: "increase" | "decrease" | "neutral";
  tooltip?: string | ReactNode;
  infoTooltip?: string | ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType,
  tooltip,
  infoTooltip,
  className,
}: StatCardProps) {
  const metricTooltip = tooltip || infoTooltip;

  const isIncrease =
    changeType === "increase" ||
    (typeof change === "number" && change > 0) ||
    (typeof change === "string" &&
      (change.startsWith("+") || parseFloat(change) > 0));

  const isDecrease =
    changeType === "decrease" ||
    (typeof change === "number" && change < 0) ||
    (typeof change === "string" &&
      (change.startsWith("-") || parseFloat(change) < 0));

  const formattedChange =
    typeof change === "number"
      ? `${change > 0 ? "+" : ""}${change}%`
      : change;

  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        {metricTooltip && <InfoTooltip content={metricTooltip} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2.5">
        <span className="text-2xl font-semibold tracking-tight text-neutral-900">
          {value}
        </span>
        {formattedChange !== undefined && formattedChange !== "" && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isIncrease && "text-emerald-600",
              isDecrease && "text-red-600",
              !isIncrease && !isDecrease && "text-neutral-500",
            )}
          >
            {isIncrease && <TrendingUp className="size-3.5 shrink-0" />}
            {isDecrease && <TrendingDown className="size-3.5 shrink-0" />}
            {formattedChange}
          </span>
        )}
      </div>
    </div>
  );
}
