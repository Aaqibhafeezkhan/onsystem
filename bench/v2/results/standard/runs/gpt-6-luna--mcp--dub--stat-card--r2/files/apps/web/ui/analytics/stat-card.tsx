import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  change,
  description,
  className,
}: {
  label: string;
  value: ReactNode;
  change: number;
  description: string;
  className?: string;
}) {
  const changeColor =
    change > 0
      ? "text-content-success"
      : change < 0
        ? "text-content-error"
        : "text-content-muted";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-default p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1 text-sm font-medium text-content-subtle">
        <span>{label}</span>
        <InfoTooltip content={description} />
      </div>
      <div className="text-3xl font-semibold tracking-tight text-content-default">
        {value}
      </div>
      <div className={cn("text-sm font-medium tabular-nums", changeColor)}>
        {change > 0 ? "+" : ""}
        {change}%
      </div>
    </div>
  );
}
