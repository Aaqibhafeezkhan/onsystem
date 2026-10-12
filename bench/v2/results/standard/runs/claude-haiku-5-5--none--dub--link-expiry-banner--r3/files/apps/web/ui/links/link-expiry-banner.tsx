import { Button } from "@dub/ui";
import { cn } from "@dub/utils";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { X } from "../shared/icons";

const EXPIRY_WARNING_WINDOW_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

interface LinkExpiryBannerProps {
  expiresAt: Date | string | null | undefined;
  onExtend?: () => void;
  className?: string;
}

function formatTimeRemaining(ms: number) {
  if (ms < HOUR_MS) {
    return "less than an hour";
  }

  const hours = Math.ceil(ms / HOUR_MS);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  className,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !expiresAt) {
    return null;
  }

  const expiresAtMs = new Date(expiresAt).getTime();
  const remainingMs = expiresAtMs - Date.now();

  // Only warn about links that are still active but expire within 24 hours.
  if (
    Number.isNaN(expiresAtMs) ||
    remainingMs <= 0 ||
    remainingMs > EXPIRY_WARNING_WINDOW_MS
  ) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 py-3 pl-4 pr-12 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <TriangleAlert className="size-4 flex-none text-amber-600" aria-hidden />
        <p className="text-sm text-amber-900">
          This link expires in{" "}
          <span className="font-semibold">
            {formatTimeRemaining(remainingMs)}
          </span>
          . Once it expires, it will stop redirecting.
        </p>
      </div>

      <div className="flex sm:flex-none">
        <Button
          type="button"
          variant="secondary"
          text="Extend expiration"
          onClick={onExtend}
          className="h-8 w-auto px-3"
        />
      </div>

      <button
        type="button"
        aria-label="Dismiss expiration warning"
        onClick={() => setDismissed(true)}
        className="absolute right-2.5 top-2.5 rounded-md p-1 text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-900 sm:top-1/2 sm:-translate-y-1/2"
      >
        <X className="size-[18px]" />
      </button>
    </div>
  );
}
