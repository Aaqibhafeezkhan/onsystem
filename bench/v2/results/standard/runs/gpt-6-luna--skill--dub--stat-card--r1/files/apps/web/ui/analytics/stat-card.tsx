import { InfoTooltip } from "@dub/ui";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  /** Percentage change from the previous period; negative values indicate a decrease. */
  change: number;
  description: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  change,
  description,
  className,
}: StatCardProps) {
  const isIncrease = change > 0;
  const isDecrease = change < 0;
  const ChangeIcon = isDecrease ? ArrowDownRight : ArrowUpRight;

  return (
    <div
      className={`flex min-w-0 flex-col rounded-xl border border-neutral-200 bg-white p-4 ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5">
        <p className="truncate text-sm font-medium text-neutral-500">{label}</p>
        <InfoTooltip content={description} />
      </div>
      <p className="mt-2 truncate text-3xl font-semibold tracking-tight text-neutral-900">
        {value}
      </p>
      <div
        className={`mt-3 flex items-center gap-1 text-sm font-medium ${
          isIncrease
            ? "text-green-600"
            : isDecrease
              ? "text-red-600"
              : "text-neutral-500"
        }`}
      >
        <ChangeIcon className="size-4" aria-hidden="true" />
        <span>{Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 1 })}%</span>
        <span className="font-normal text-neutral-500">vs. previous period</span>
      </div>
    </div>
  );
}
