import { InfoTooltip } from "@dub/ui";
import { ArrowTrendUp } from "@dub/ui/icons";
import { cn } from "@dub/utils";

export function StatCard({
  label,
  value,
  change,
  description,
  className,
}: {
  label: string;
  value: string | number;
  /** Percentage change compared with the previous period. */
  change: number;
  /** Explanation shown when the info icon is hovered or focused. */
  description: string;
  className?: string;
}) {
  const isIncrease = change >= 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-5",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-neutral-600">{label}</span>
        <InfoTooltip content={description} aria-label={`About ${label}`} />
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
        {value}
      </div>
      <div
        className={cn(
          "mt-2 inline-flex items-center gap-1 text-sm font-medium",
          isIncrease ? "text-green-600" : "text-red-600",
        )}
      >
        <ArrowTrendUp
          aria-hidden="true"
          className={cn("size-4", !isIncrease && "rotate-180")}
        />
        <span>{Math.abs(change)}%</span>
      </div>
    </div>
  );
}
