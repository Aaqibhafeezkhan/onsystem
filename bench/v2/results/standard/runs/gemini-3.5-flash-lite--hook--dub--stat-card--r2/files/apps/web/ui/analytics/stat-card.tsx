import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  change?: number | string;
  changeType?: "increase" | "decrease";
  info?: ReactNode;
  className?: string;
  icon?: React.ElementType;
}

export function StatCard({
  label,
  value,
  change,
  changeType,
  info,
  className,
  icon: Icon,
}: StatCardProps) {
  const isNumericChange = typeof change === "number";
  const stringChange = typeof change === "string" ? change : change?.toString();
  const inferredType =
    changeType ||
    (isNumericChange
      ? (change as number) >= 0
        ? "increase"
        : "decrease"
      : stringChange?.startsWith("-")
        ? "decrease"
        : "increase");

  const isIncrease = inferredType === "increase";

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
          {Icon && <Icon className="size-4 text-neutral-400" />}
          <span>{label}</span>
        </div>
        {info && <InfoTooltip content={info} />}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight text-neutral-900">
          {value}
        </span>
        {change !== undefined && change !== null && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isIncrease ? "text-emerald-600" : "text-red-600",
            )}
          >
            {isIncrease ? (
              <ArrowUp className="size-3.5 shrink-0" />
            ) : (
              <ArrowDown className="size-3.5 shrink-0" />
            )}
            <span>{stringChange}</span>
          </div>
        )}
      </div>
    </div>
  );
}
