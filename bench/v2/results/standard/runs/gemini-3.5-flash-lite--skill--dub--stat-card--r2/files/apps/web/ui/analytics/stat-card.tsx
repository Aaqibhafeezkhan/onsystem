import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  change?: number | string;
  changeType?: "increase" | "decrease";
  tooltip?: ReactNode;
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
  const numericChange =
    typeof change === "number"
      ? change
      : typeof change === "string"
      ? parseFloat(change.replace(/[^0-9.-]/g, ""))
      : 0;

  const isIncrease =
    changeType
      ? changeType === "increase"
      : typeof change === "number"
      ? change >= 0
      : typeof change === "string"
      ? !change.startsWith("-") && numericChange >= 0
      : true;

  const formattedChange =
    typeof change === "number"
      ? `${change >= 0 ? "+" : ""}${change}%`
      : change;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-xs font-medium text-neutral-500 sm:text-sm">
            {label}
          </span>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div className="min-w-0 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
          {value}
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium sm:text-sm",
              isIncrease ? "text-green-600" : "text-red-600",
            )}
          >
            {isIncrease ? (
              <ArrowUp className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{formattedChange}</span>
          </div>
        )}
      </div>
    </div>
  );
}
