import { InfoTooltip } from "@dub/ui";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  change,
  description,
  changeDirection,
  className,
}: {
  label: string;
  value: ReactNode;
  change: string | number;
  description: string;
  /** Override the direction inferred from a negative change value. */
  changeDirection?: "increase" | "decrease";
  className?: string;
}) {
  const isIncrease =
    changeDirection === undefined
      ? typeof change === "number"
        ? change >= 0
        : !change.trim().startsWith("-")
      : changeDirection === "increase";
  const ChangeIcon = isIncrease ? ArrowUp : ArrowDown;

  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white p-4 ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        <InfoTooltip content={description} />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
        {value}
      </div>
      <div
        className={`mt-2 flex items-center gap-1 text-sm font-medium ${
          isIncrease ? "text-green-600" : "text-red-600"
        }`}
      >
        <ChangeIcon className="size-4" aria-hidden="true" />
        <span>{change}</span>
      </div>
    </div>
  );
}
