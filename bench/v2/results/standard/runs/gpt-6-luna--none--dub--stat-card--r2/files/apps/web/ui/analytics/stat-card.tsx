import { InfoTooltip } from "@dub/ui";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  change,
  description,
}: {
  label: string;
  value: ReactNode;
  /** Percentage change from the previous period. */
  change: number;
  /** Explanation shown when hovering or focusing the info icon. */
  description: string;
}) {
  const isIncrease = change > 0;
  const isDecrease = change < 0;
  const ChangeIcon = isDecrease ? ArrowDown : ArrowUp;

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        <span className="truncate text-sm font-medium text-neutral-600">
          {label}
        </span>
        <InfoTooltip content={description} />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold tracking-tight text-neutral-900">
          {value}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-sm font-medium ${
            isIncrease
              ? "text-green-600"
              : isDecrease
                ? "text-red-600"
                : "text-neutral-500"
          }`}
          aria-label={`${change > 0 ? "Increased" : change < 0 ? "Decreased" : "No change"} by ${Math.abs(change)}%`}
        >
          <ChangeIcon className="size-3.5" aria-hidden="true" />
          {change > 0 ? "+" : change < 0 ? "−" : ""}
          {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
}
