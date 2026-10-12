import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  change?: number | string;
  changeLabel?: string;
  tooltip: string | ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  tooltip,
  className,
}: StatCardProps) {
  const isIncrease =
    change !== undefined &&
    (typeof change === "number"
      ? change > 0
      : !change.startsWith("-") && change !== "0" && change !== "0%");
  const isDecrease =
    change !== undefined &&
    (typeof change === "number" ? change < 0 : change.startsWith("-"));

  const formattedChange =
    typeof change === "number"
      ? `${change > 0 ? `+${change}` : change}%`
      : change;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-neutral-500">{label}</span>
        <InfoTooltip content={tooltip} />
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-content-emphasis text-2xl font-semibold tracking-tight">
          {value}
        </div>

        {change !== undefined && (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "flex items-center font-medium",
                isIncrease && "text-green-600",
                isDecrease && "text-red-600",
                !isIncrease && !isDecrease && "text-neutral-500",
              )}
            >
              {isIncrease && <ArrowUp className="mr-0.5 size-3.5" />}
              {isDecrease && <ArrowDown className="mr-0.5 size-3.5" />}
              {formattedChange}
            </span>
            {changeLabel && (
              <span className="text-neutral-500">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
