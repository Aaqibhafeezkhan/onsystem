import { InfoTooltip } from "@dub/ui";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  change,
  description,
}: {
  label: string;
  value: ReactNode;
  /** Percentage-point change; positive values indicate an increase. */
  change: number;
  description: string;
}) {
  const isIncrease = change > 0;
  const isDecrease = change < 0;
  const changeColor = isIncrease
    ? "text-green-600"
    : isDecrease
      ? "text-red-600"
      : "text-neutral-500";
  const ChangeIcon = isIncrease
    ? ArrowUpRight
    : isDecrease
      ? ArrowDownRight
      : null;
  const formattedChange = `${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        <span className="truncate text-sm font-medium text-neutral-600">
          {label}
        </span>
        <InfoTooltip content={description} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="truncate text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
          {value}
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-medium tabular-nums ${changeColor}`}
          aria-label={`${formattedChange} change`}
        >
          {ChangeIcon && <ChangeIcon className="size-4" aria-hidden="true" />}
          <span>{formattedChange}</span>
        </div>
      </div>
    </div>
  );
}
