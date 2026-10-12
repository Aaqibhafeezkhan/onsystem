import { Tooltip } from "@dub/ui";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { ReactNode } from "react";

export type StatCardProps = {
  label: string;
  value: ReactNode;
  /** Percentage change compared with the previous period. */
  change: number;
  description: string;
};

export function StatCard({ label, value, change, description }: StatCardProps) {
  const isIncrease = change > 0;
  const isDecrease = change < 0;
  const ChangeIcon = isIncrease ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        <p className="truncate text-sm font-medium text-neutral-600">{label}</p>
        <Tooltip content={description}>
          <button
            type="button"
            aria-label={`About ${label}`}
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <Info aria-hidden="true" className="size-3.5" />
          </button>
        </Tooltip>
      </div>
      <p className="truncate text-3xl font-semibold tracking-tight text-neutral-950">
        {value}
      </p>
      <div
        className={`flex items-center gap-1 text-xs font-medium ${
          isIncrease
            ? "text-green-600"
            : isDecrease
              ? "text-red-600"
              : "text-neutral-500"
        }`}
      >
        {change === 0 ? (
          <span aria-hidden="true" className="text-sm leading-none">
            –
          </span>
        ) : (
          <ChangeIcon aria-hidden="true" className="size-3.5" />
        )}
        <span>{`${change > 0 ? "+" : ""}${change}%`}</span>
        <span className="font-normal text-neutral-500">vs. previous period</span>
      </div>
    </div>
  );
}
