import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  label: ReactNode | string;
  value: ReactNode | string | number;
  tooltip?: ReactNode | string;
  change?: number | string;
  changeType?: "increase" | "decrease" | "neutral";
  className?: string;
}

export function StatCard({
  label,
  value,
  tooltip,
  change,
  changeType,
  className,
}: StatCardProps) {
  const isNumber = typeof change === "number";
  const effectiveChangeType =
    changeType ??
    (isNumber
      ? change > 0
        ? "increase"
        : change < 0
          ? "decrease"
          : "neutral"
      : typeof change === "string" && change.startsWith("-")
        ? "decrease"
        : "increase");

  const isIncrease = effectiveChangeType === "increase";
  const isDecrease = effectiveChangeType === "decrease";

  const formattedChange = isNumber
    ? `${change > 0 ? "+" : ""}${change}%`
    : change;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-neutral-500">{label}</span>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-neutral-900 tabular-nums">
          {value}
        </span>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isIncrease && "text-green-600",
              isDecrease && "text-red-600",
              effectiveChangeType === "neutral" && "text-neutral-500",
            )}
          >
            {isIncrease && <ArrowUp className="size-3.5 shrink-0" />}
            {isDecrease && <ArrowDown className="size-3.5 shrink-0" />}
            <span>{formattedChange}</span>
          </div>
        )}
      </div>
    </div>
  );
}
