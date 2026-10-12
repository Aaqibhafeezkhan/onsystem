import { InfoTooltip } from "@dub/ui";
import { cn } from "@dub/utils";
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
  /** Numeric changes are displayed as percentages; strings are displayed as provided. */
  change: number | string;
  description: string;
  changeDirection?: "increase" | "decrease";
  className?: string;
}) {
  const inferredDirection =
    typeof change === "number"
      ? change > 0
        ? "increase"
        : change < 0
          ? "decrease"
          : undefined
      : change.trim().startsWith("-")
        ? "decrease"
        : change.trim() && !/^0+(?:\.0+)?%?$/.test(change.trim())
          ? "increase"
          : undefined;
  const direction = changeDirection ?? inferredDirection;
  const changeText =
    typeof change === "number"
      ? `${Math.abs(change)}%`
      : change.replace(/^[+-]/, "");
  const ChangeIcon = direction === "increase" ? ArrowUp : ArrowDown;

  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-bg-default p-4",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-content-subtle">{label}</p>
        <InfoTooltip content={description} />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-content-default">
        {value}
      </p>
      {direction ? (
        <div
          className={`mt-2 flex items-center gap-1 text-sm font-medium ${
            direction === "increase" ? "text-content-success" : "text-content-error"
          }`}
          aria-label={`${changeText} ${direction}`}
        >
          <ChangeIcon className="size-3.5" aria-hidden="true" />
          <span>{changeText}</span>
        </div>
      ) : (
        <p className="mt-2 text-sm font-medium text-content-muted">{changeText}</p>
      )}
    </div>
  );
}
