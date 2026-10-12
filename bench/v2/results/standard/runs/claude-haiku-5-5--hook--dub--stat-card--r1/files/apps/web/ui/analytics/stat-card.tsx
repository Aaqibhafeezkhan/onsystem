import { InfoTooltip } from "@dub/ui";
import { cn, nFormatter } from "@dub/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  change,
  tooltip,
  className,
}: {
  label: string;
  value: number | string;
  // Percentage change vs. the previous period (e.g. 12.5 means +12.5%).
  // Omit or pass null when there is no comparison to show.
  change?: number | null;
  tooltip: ReactNode;
  className?: string;
}) {
  const displayValue = typeof value === "number" ? nFormatter(value) : value;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 sm:rounded-xl",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-neutral-500">{label}</span>
        <InfoTooltip content={tooltip} />
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-semibold text-neutral-900">
          {displayValue}
        </span>
        {typeof change === "number" && <ChangeIndicator change={change} />}
      </div>
    </div>
  );
}

function ChangeIndicator({ change }: { change: number }) {
  const magnitude = Number(Math.abs(change).toFixed(1));
  const formatted = `${magnitude}%`;

  if (change > 0) {
    return (
      <span
        className="flex items-center gap-0.5 text-sm font-medium text-green-600"
        aria-label={`Increased by ${formatted}`}
      >
        <ArrowUp className="size-3.5" aria-hidden="true" />
        {formatted}
      </span>
    );
  }

  if (change < 0) {
    return (
      <span
        className="flex items-center gap-0.5 text-sm font-medium text-red-600"
        aria-label={`Decreased by ${formatted}`}
      >
        <ArrowDown className="size-3.5" aria-hidden="true" />
        {formatted}
      </span>
    );
  }

  return (
    <span
      className="text-sm font-medium text-neutral-500"
      aria-label="No change"
    >
      {formatted}
    </span>
  );
}
