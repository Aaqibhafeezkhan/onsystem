import { InfoTooltip } from "@dub/ui";
import { ArrowTrendUp } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { ReactNode } from "react";

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  change?: number; // percentage change, e.g. 12.5 for +12.5%, -5 for -5%
  changeText?: ReactNode; // custom change text override
  trend?: "increase" | "decrease" | "neutral";
  tooltip: ReactNode;
  icon?: ReactNode;
  className?: string;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  change,
  changeText,
  trend: trendProp,
  tooltip,
  icon,
  className,
  loading,
}: StatCardProps) {
  const trend =
    trendProp ??
    (change !== undefined
      ? change > 0
        ? "increase"
        : change < 0
          ? "decrease"
          : "neutral"
      : "neutral");

  const formattedChangeText =
    changeText ??
    (change !== undefined
      ? `${change > 0 ? "+" : ""}${change}%`
      : null);

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-neutral-500">
          {icon}
          <span className="text-xs font-medium text-neutral-500">{label}</span>
        </div>
        <InfoTooltip content={tooltip} />
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded-md bg-neutral-200" />
        ) : (
          <span className="text-2xl font-semibold tracking-tight text-neutral-900">
            {value}
          </span>
        )}

        {formattedChangeText && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "increase" && "text-green-600",
              trend === "decrease" && "text-red-600",
              trend === "neutral" && "text-neutral-500",
            )}
          >
            {trend === "increase" && (
              <ArrowTrendUp className="size-3.5 shrink-0" />
            )}
            {trend === "decrease" && (
              <ArrowTrendUp className="size-3.5 shrink-0 rotate-180" />
            )}
            <span>{formattedChangeText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
