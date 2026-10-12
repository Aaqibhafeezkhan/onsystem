import { Badge, InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  change?: number | string;
  changeType?: "increase" | "decrease" | "neutral";
  tooltip?: ReactNode | string;
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
    (typeof change === "string" && !change.startsWith("-"));

  const isDecrease =
    changeType === "decrease" ||
    (typeof change === "number" && change < 0) ||
    (typeof change === "string" && change.startsWith("-"));

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <div className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
          {value}
        </div>
        {change !== undefined && change !== null && (
          <Badge
            variant={isIncrease ? "green" : isDecrease ? "red" : "neutral"}
            className="rounded-md px-2 py-1 text-xs font-medium"
          >
            {typeof change === "number"
              ? `${change > 0 ? "+" : ""}${change}%`
              : change}
          </Badge>
        )}
      </div>
    </div>
  );
}
