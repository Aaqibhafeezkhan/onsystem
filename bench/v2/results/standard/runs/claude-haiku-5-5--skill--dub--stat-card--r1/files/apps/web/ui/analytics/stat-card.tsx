import { Button, Tooltip } from "@dub/ui";
import { CircleInfo } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

export function StatCard({
  label,
  value,
  change,
  tooltip,
  className,
}: {
  label: string;
  value: string | number;
  // Percentage change vs. the previous period, e.g. 12.5 for +12.5%.
  change?: number;
  // Explains what the metric means; shown when hovering the info icon.
  tooltip: string;
  className?: string;
}) {
  const isIncrease = change !== undefined && change > 0;
  const isDecrease = change !== undefined && change < 0;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-lg border border-border-subtle bg-bg-default p-4 sm:rounded-xl",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-content-subtle">
          {label}
        </span>
        <Tooltip content={tooltip}>
          <Button
            type="button"
            variant="outline"
            aria-label={`About ${label}`}
            icon={<CircleInfo className="size-3.5" />}
            className="size-6 shrink-0 p-0 text-content-subtle"
          />
        </Tooltip>
      </div>

      <span className="truncate text-2xl font-semibold leading-tight text-content-emphasis">
        {value}
      </span>

      {change !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isIncrease && "text-content-success",
            isDecrease && "text-content-error",
            !isIncrease && !isDecrease && "text-content-subtle",
          )}
        >
          {isIncrease && <ArrowUp className="size-3" aria-hidden="true" />}
          {isDecrease && <ArrowDown className="size-3" aria-hidden="true" />}
          <span>
            {isIncrease ? "+" : isDecrease ? "-" : ""}
            {Math.abs(change).toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}
            %
          </span>
        </div>
      )}
    </div>
  );
}
