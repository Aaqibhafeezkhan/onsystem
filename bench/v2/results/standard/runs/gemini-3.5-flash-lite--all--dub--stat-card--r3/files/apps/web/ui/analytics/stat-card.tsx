import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  change?: number | string;
  trend?: "increase" | "decrease";
  infoTooltip?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  trend,
  infoTooltip,
  className,
}: StatCardProps) {
  const isIncrease =
    trend === "increase" ||
    (typeof change === "number" && change > 0) ||
    (typeof change === "string" && change.startsWith("+"));

  const isDecrease =
    trend === "decrease" ||
    (typeof change === "number" && change < 0) ||
    (typeof change === "string" && change.startsWith("-"));

  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-4 transition-all",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">{label}</span>
        {infoTooltip && <InfoTooltip content={infoTooltip} />}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-semibold tracking-tight text-neutral-950">
          {value}
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isIncrease && "text-green-600",
              isDecrease && "text-red-600",
              !isIncrease && !isDecrease && "text-neutral-500",
            )}
          >
            {isIncrease && <ArrowUp className="size-3.5" />}
            {isDecrease && <ArrowDown className="size-3.5" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
