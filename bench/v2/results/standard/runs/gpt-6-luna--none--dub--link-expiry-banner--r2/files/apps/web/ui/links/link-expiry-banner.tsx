import { Button, TriangleWarning } from "@dub/ui";
import { cn, formatDateTime } from "@dub/utils";
import { X } from "lucide-react";
import { useState } from "react";

const HOURS_24 = 24 * 60 * 60 * 1000;

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  className,
}: {
  expiresAt: Date | string | null;
  onExtendExpiration: () => void;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const expirationDate = expiresAt ? new Date(expiresAt) : null;
  const timeUntilExpiration = expirationDate
    ? expirationDate.getTime() - Date.now()
    : null;

  if (
    dismissed ||
    !expirationDate ||
    timeUntilExpiration === null ||
    !Number.isFinite(timeUntilExpiration) ||
    timeUntilExpiration < 0 ||
    timeUntilExpiration > HOURS_24
  ) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5 pr-8 sm:items-center sm:pr-0">
        <TriangleWarning className="mt-0.5 size-4 shrink-0 text-amber-600 sm:mt-0" />
        <p className="text-sm">
          This short link expires on{" "}
          <span className="font-medium">
            {formatDateTime(expirationDate, { year: undefined })}
          </span>
          .
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-6 sm:pl-0">
        <Button
          variant="secondary"
          text="Extend expiration"
          className="h-8 w-fit"
          onClick={onExtendExpiration}
        />
      </div>

      <Button
        variant="outline"
        icon={<X className="size-4" />}
        className="absolute right-2 top-2 size-8 rounded-md border-transparent p-0 text-amber-800 hover:bg-amber-100"
        aria-label="Dismiss expiration warning"
        onClick={() => setDismissed(true)}
      />
    </div>
  );
}
