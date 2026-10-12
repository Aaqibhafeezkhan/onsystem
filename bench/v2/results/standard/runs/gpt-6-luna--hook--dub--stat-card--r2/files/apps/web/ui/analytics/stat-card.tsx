import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  change,
  description,
  className,
}: {
  label: string;
  value: ReactNode;
  /** Percentage change; positive values indicate an increase, negative values a decrease. */
  change: number;
  description: string;
  className?: string;
}) {
  const isIncrease = change > 0;
  const isDecrease = change < 0;
  const ChangeIcon = isDecrease ? ArrowDownRight : ArrowUpRight;

  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-500">
        <span>{label}</span>
        <InfoTooltip content={description} />
      </div>
      <div className="mt-2 text-2xl font-semibold leading-none tracking-tight text-neutral-900">
        {value}
      </div>
      <div
        className={cn(
          "mt-3 inline-flex items-center gap-1 text-sm font-medium",
          isIncrease && "text-green-600",
          isDecrease && "text-red-600",
          !isIncrease && !isDecrease && "text-neutral-500",
        )}
        aria-label={`${Math.abs(change)}% ${isIncrease ? "increase" : isDecrease ? "decrease" : "change"}`}
      >
        <ChangeIcon className="size-4" aria-hidden="true" />
        <span>{Math.abs(change)}%</span>
      </div>
    </div>
  );
}
