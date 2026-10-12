import { Alert, AlertDescription, Button } from "@dub/ui";
import { CircleWarning, Xmark } from "@dub/ui/icons";
import { useState } from "react";

const EXPIRY_WINDOW_MS = 24 * 60 * 60 * 1000;

interface LinkExpiryBannerProps {
  expiresAt: Date | string | null | undefined;
  onExtend: () => void;
  now?: Date;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  now = new Date(),
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !expiresAt) return null;

  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return null;

  const remainingMs = expiresAtMs - now.getTime();
  if (remainingMs <= 0 || remainingMs > EXPIRY_WINDOW_MS) return null;

  const remainingHours = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));

  return (
    <Alert className="flex items-start gap-3">
      <CircleWarning className="mt-0.5 h-4 w-4 shrink-0 text-content-warning" />
      <AlertDescription className="flex-1">
        This link expires in less than {remainingHours}{" "}
        {remainingHours === 1 ? "hour" : "hours"}. Extend its expiration to keep
        it active.
      </AlertDescription>
      <Button
        variant="secondary"
        className="h-7 w-auto shrink-0 px-2.5"
        text="Extend expiration"
        onClick={onExtend}
      />
      <Button
        variant="outline"
        className="h-7 w-7 shrink-0 p-0"
        icon={<Xmark className="h-3 w-3" />}
        aria-label="Dismiss expiry warning"
        onClick={() => setDismissed(true)}
      />
    </Alert>
  );
}
