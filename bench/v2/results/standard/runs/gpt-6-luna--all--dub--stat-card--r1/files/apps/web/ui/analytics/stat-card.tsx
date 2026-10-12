import { InfoTooltip } from "@dub/ui";
import { ArrowTrendUp } from "@dub/ui/icons";
import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  change,
  description,
}: {
  label: string;
  value: ReactNode;
  change: number;
  description: string;
}) {
  const isIncrease = change >= 0;
  const formattedChange = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  }).format(Math.abs(change));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-600">
        <span>{label}</span>
        <InfoTooltip content={description} aria-label={`About ${label}`} />
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
        {value}
      </div>
      <div
        className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${
          isIncrease ? "text-green-600" : "text-red-600"
        }`}
        aria-label={`${isIncrease ? "Increase" : "Decrease"} of ${formattedChange}%`}
      >
        <ArrowTrendUp
          aria-hidden="true"
          className={`size-4 ${isIncrease ? "" : "rotate-180"}`}
        />
        <span>{isIncrease ? "+" : "−"}{formattedChange}%</span>
      </div>
    </div>
  );
}
