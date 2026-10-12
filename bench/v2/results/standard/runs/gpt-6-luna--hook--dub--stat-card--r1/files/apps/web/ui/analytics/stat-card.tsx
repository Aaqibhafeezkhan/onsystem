import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  change,
  description,
  changeLabel = "vs. previous period",
  className,
}: {
  label: string;
  value: ReactNode;
  /** Percentage change from the comparison period; positive is an increase. */
  change: number;
  description: string;
  changeLabel?: string;
  className?: string;
}) {
  const isIncrease = change > 0;
  const isDecrease = change < 0;
  const ChangeIcon = isIncrease ? ArrowUp : isDecrease ? ArrowDown : Minus;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col rounded-xl border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-500">
        <span className="truncate">{label}</span>
        <InfoTooltip content={description} />
      </div>
      <div className="mt-2 truncate text-3xl font-semibold tracking-tight text-neutral-950">
        {value}
      </div>
      <div
        className={cn(
          "mt-2 flex items-center gap-1 text-xs font-medium",
          isIncrease && "text-green-600",
          isDecrease && "text-red-600",
          !isIncrease && !isDecrease && "text-neutral-500",
        )}
      >
        <ChangeIcon className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{`${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(Math.abs(change))}%`}</span>
        <span className="font-normal text-neutral-500">{changeLabel}</span>
      </div>
    </div>
  );
}
