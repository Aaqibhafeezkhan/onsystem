import { Button, TriangleWarning } from "@dub/ui";
import { useState } from "react";
import { X } from "../shared/icons";

const HOUR_IN_MS = 60 * 60 * 1000;
const EXPIRY_WINDOW_MS = 24 * HOUR_IN_MS;

function formatTimeRemaining(ms: number) {
  const totalMinutes = Math.max(1, Math.ceil(ms / (60 * 1000)));
  if (totalMinutes < 60) {
    return `${totalMinutes} ${totalMinutes === 1 ? "minute" : "minutes"}`;
  }
  const hours = Math.round(totalMinutes / 60);
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  className,
}: {
  expiresAt: Date | string | null | undefined;
  onExtend?: () => void;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !expiresAt) return null;

  const expiresAtTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtTime)) return null;

  const msRemaining = expiresAtTime - Date.now();
  if (msRemaining <= 0 || msRemaining > EXPIRY_WINDOW_MS) return null;

  return (
    <div
      role="alert"
      className={`relative flex flex-col gap-3 rounded-lg bg-bg-attention py-3 pl-4 pr-12 text-sm text-content-attention sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      <div className="flex items-center gap-2.5">
        <TriangleWarning className="size-4 shrink-0" />
        <p>
          This short link expires in{" "}
          <span className="font-semibold">
            {formatTimeRemaining(msRemaining)}
          </span>
          . Extend its expiration to keep it working.
        </p>
      </div>

      <Button
        type="button"
        variant="secondary"
        text="Extend expiration"
        className="h-8 w-auto shrink-0 px-3"
        onClick={() => onExtend?.()}
      />

      <Button
        type="button"
        variant="outline"
        aria-label="Dismiss expiration warning"
        icon={<X className="size-[18px]" />}
        className="absolute right-2.5 top-2.5 h-7 w-7 px-0 sm:top-1/2 sm:-translate-y-1/2"
        onClick={() => setDismissed(true)}
      />
    </div>
  );
}
