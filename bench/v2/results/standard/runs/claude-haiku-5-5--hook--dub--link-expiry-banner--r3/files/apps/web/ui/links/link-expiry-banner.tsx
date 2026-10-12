"use client";

import { Button, TriangleWarning } from "@dub/ui";
import { cn } from "@dub/utils";
import { useState } from "react";
import { X } from "../shared/icons";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

interface LinkExpiryBannerProps {
  expiresAt: Date | string | null | undefined;
  onExtendExpiration: () => void;
  className?: string;
}

function formatTimeLeft(remainingMs: number) {
  const hours = Math.floor(remainingMs / HOUR_MS);
  if (hours < 1) return "in less than an hour";
  return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  className,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !expiresAt) return null;

  const remainingMs = new Date(expiresAt).getTime() - Date.now();

  // Only show for links that have not expired yet and expire within 24 hours.
  if (Number.isNaN(remainingMs) || remainingMs <= 0 || remainingMs > DAY_MS) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 py-2.5 pl-4 pr-2 text-amber-900",
        className,
      )}
    >
      <TriangleWarning
        variant="fill"
        className="size-4 shrink-0 text-amber-500"
        aria-hidden
      />
      <p className="min-w-0 flex-1 text-sm">
        This short link expires{" "}
        <span className="font-semibold">{formatTimeLeft(remainingMs)}</span>.
      </p>
      <Button
        type="button"
        variant="secondary"
        text="Extend expiration"
        onClick={onExtendExpiration}
        className="h-7 w-fit shrink-0 px-2.5 text-sm font-medium"
      />
      <Button
        type="button"
        variant="outline"
        aria-label="Dismiss expiration warning"
        icon={<X className="size-4" />}
        onClick={() => setDismissed(true)}
        className="size-7 w-auto shrink-0 p-0 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
      />
    </div>
  );
}
