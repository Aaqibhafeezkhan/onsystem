import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";

type StatCardProps = {
  /** Short name of the metric. */
  label: string;
  /** The current metric value. */
  value: ReactNode;
  /** Change from the previous comparison period (for example, "12%"). */
  change: ReactNode;
  /** Whether the change represents an increase or a decrease. */
  changeDirection: "increase" | "decrease";
  /** Explanation shown when the info icon is hovered or focused. */
  description: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  change,
  changeDirection,
  description,
  className,
}: StatCardProps) {
  const isIncrease = changeDirection === "increase";
  const ChangeIcon = isIncrease ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="truncate text-sm font-medium text-neutral-500">
          {label}
        </span>
        <InfoTooltip content={description} />
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-2xl font-semibold tracking-tight text-neutral-900">
          {value}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium",
            isIncrease ? "text-content-success" : "text-content-error",
          )}
          aria-label={`${changeDirection} by ${typeof change === "string" || typeof change === "number" ? change : ""}`}
        >
          <ChangeIcon className="size-3.5" aria-hidden="true" />
          {change}
        </span>
      </div>
    </div>
  );
}
