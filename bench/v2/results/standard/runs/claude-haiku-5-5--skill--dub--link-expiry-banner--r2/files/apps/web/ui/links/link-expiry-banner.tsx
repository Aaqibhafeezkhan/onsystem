import { Button } from "@dub/ui";
import { TriangleWarning } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { useState } from "react";
import { X } from "../shared/icons";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getTimeLeftText(expiresAt: Date, now: number) {
  const hoursLeft = Math.ceil((expiresAt.getTime() - now) / (60 * 60 * 1000));

  if (hoursLeft <= 1) return "in less than 1 hour";
  return `in ${hoursLeft} hours`;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  className,
}: {
  expiresAt: Date | string | null | undefined;
  onExtend: () => void;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !expiresAt) return null;

  const expiryDate = new Date(expiresAt);
  const now = Date.now();
  const msLeft = expiryDate.getTime() - now;

  // Only show for links that have not expired yet and expire within 24 hours.
  if (Number.isNaN(msLeft) || msLeft <= 0 || msLeft > DAY_IN_MS) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 py-2.5 pl-4 pr-2 text-sm text-amber-900",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <TriangleWarning className="size-4 shrink-0 text-amber-600" />
        <p className="min-w-0">
          This short link expires{" "}
          <span className="font-medium">
            {getTimeLeftText(expiryDate, now)}
          </span>
          .
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="secondary"
          text="Extend expiration"
          onClick={onExtend}
          className="h-8 w-auto border-amber-300 px-3 text-amber-900 hover:bg-amber-100"
        />
        <Button
          type="button"
          variant="outline"
          aria-label="Dismiss expiration warning"
          icon={<X className="size-4" />}
          onClick={() => setDismissed(true)}
          className="h-8 w-8 px-0 text-amber-700 hover:bg-amber-100"
        />
      </div>
    </div>
  );
}
