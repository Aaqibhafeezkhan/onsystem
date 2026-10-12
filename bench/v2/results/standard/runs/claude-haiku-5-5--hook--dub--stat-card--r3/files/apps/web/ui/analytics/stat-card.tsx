import { Button, Tooltip } from "@dub/ui";
import { cn, nFormatter } from "@dub/utils";
import { ArrowDown, ArrowUp, HelpCircle, Minus } from "lucide-react";

export interface StatCardProps {
  /** Metric label, e.g. "Total clicks". */
  label: string;
  /** Metric value. Numbers are formatted with thousands separators. */
  value: number | string;
  /**
   * Percentage change versus the previous period, e.g. `12.5` for +12.5%
   * and `-3` for -3%. Omit to hide the change indicator.
   */
  change?: number;
  /** Explanation of the metric, shown in the info tooltip. */
  tooltip: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  tooltip,
  className,
}: StatCardProps) {
  const displayValue =
    typeof value === "number" ? nFormatter(value, { full: true }) : value;

  const direction =
    change === undefined || change === 0
      ? "neutral"
      : change > 0
        ? "increase"
        : "decrease";

  const ChangeIcon =
    direction === "increase"
      ? ArrowUp
      : direction === "decrease"
        ? ArrowDown
        : Minus;

  const formattedChange =
    change !== undefined
      ? `${Math.abs(change).toLocaleString("en-US", {
          maximumFractionDigits: 1,
        })}%`
      : null;

  return (
    <div
      className={cn(
        "border-border-subtle bg-bg-default flex flex-col gap-2 rounded-lg border p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-content-subtle text-sm font-medium">{label}</span>
        <Tooltip content={tooltip}>
          <Button
            type="button"
            variant="outline"
            aria-label={`About ${label}`}
            icon={<HelpCircle className="size-3.5" aria-hidden="true" />}
            className="text-content-muted hover:text-content-default h-auto w-auto p-0.5"
          />
        </Tooltip>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-content-emphasis text-2xl font-semibold leading-none tabular-nums">
          {displayValue}
        </span>

        {formattedChange !== null && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium tabular-nums",
              direction === "increase" && "text-content-success",
              direction === "decrease" && "text-content-error",
              direction === "neutral" && "text-content-subtle",
            )}
            aria-label={
              direction === "increase"
                ? `Increased by ${formattedChange}`
                : direction === "decrease"
                  ? `Decreased by ${formattedChange}`
                  : `No change`
            }
          >
            <ChangeIcon className="size-3" aria-hidden="true" />
            {formattedChange}
          </span>
        )}
      </div>
    </div>
  );
}
