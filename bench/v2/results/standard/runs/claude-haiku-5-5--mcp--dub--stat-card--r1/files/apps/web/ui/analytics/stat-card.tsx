import { Badge, Tooltip } from "@dub/ui";
import { CaretUp, CircleInfo } from "@dub/ui/icons";
import { cn, nFormatter } from "@dub/utils";

export function StatCard({
  label,
  value,
  change,
  description,
  className,
}: {
  label: string;
  value: number | string;
  // Percentage change versus the previous period, e.g. 12.5 for +12.5%
  change?: number;
  // Explanation of the metric, shown in a tooltip
  description: string;
  className?: string;
}) {
  const isIncrease = change !== undefined && change > 0;
  const isDecrease = change !== undefined && change < 0;

  const badgeVariant = isIncrease ? "green" : isDecrease ? "red" : "gray";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="truncate text-sm font-medium text-neutral-600">
          {label}
        </span>
        <Tooltip content={description} side="top">
          <Button
            type="button"
            variant="outline"
            aria-label={`About ${label}`}
            icon={<CircleInfo className="h-4 w-4 text-neutral-400" />}
            className="h-6 w-6 p-0"
          />
        </Tooltip>
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-semibold text-neutral-900">
          {typeof value === "number" ? nFormatter(value) : value}
        </span>

        {change !== undefined && (
          <Badge
            variant={badgeVariant}
            className="flex items-center gap-0.5"
            aria-label={`${isIncrease ? "Increased" : isDecrease ? "Decreased" : "No change"} by ${Math.abs(change).toFixed(1)}%`}
          >
            {isIncrease && <CaretUp className="h-3 w-3" />}
            {isDecrease && <CaretUp className="h-3 w-3 rotate-180" />}
            {Math.abs(change).toFixed(1)}%
          </Badge>
        )}
      </div>
    </div>
  );
}
