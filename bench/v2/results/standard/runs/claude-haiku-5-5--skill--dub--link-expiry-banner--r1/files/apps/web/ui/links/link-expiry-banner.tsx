import { Button, TriangleWarning } from "@dub/ui";
import { useState } from "react";
import { X } from "../shared/icons";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

function formatTimeLeft(ms: number) {
  if (ms < HOUR_IN_MS) {
    const minutes = Math.max(1, Math.ceil(ms / MINUTE_IN_MS));
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }

  const hours = Math.ceil(ms / HOUR_IN_MS);
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
}: {
  expiresAt: Date | string | null | undefined;
  onExtend?: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !expiresAt) {
    return null;
  }

  const expiresAtMs = new Date(expiresAt).getTime();
  const timeLeftMs = expiresAtMs - Date.now();

  // Only warn while the link is still active and expires within the next 24 hours.
  if (Number.isNaN(expiresAtMs) || timeLeftMs <= 0 || timeLeftMs > DAY_IN_MS) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg bg-bg-warning px-4 py-3 text-sm"
    >
      <TriangleWarning className="size-4 shrink-0 text-content-warning" />

      <p className="min-w-0 flex-1 text-content-emphasis">
        This short link expires in{" "}
        <span className="font-semibold">{formatTimeLeft(timeLeftMs)}</span>.
      </p>

      <Button
        variant="secondary"
        text="Extend expiration"
        onClick={onExtend}
        className="h-8 w-auto shrink-0 px-2.5"
      />

      <Button
        variant="outline"
        icon={<X className="size-4" />}
        aria-label="Dismiss expiration warning"
        onClick={() => setDismissed(true)}
        className="h-8 w-8 shrink-0 p-0"
      />
    </div>
  );
}
