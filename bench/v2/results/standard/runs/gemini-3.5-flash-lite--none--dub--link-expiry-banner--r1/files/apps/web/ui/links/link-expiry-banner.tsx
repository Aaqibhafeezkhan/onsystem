"use client";

import { X } from "@/ui/shared/icons";
import { Button } from "@dub/ui";
import { TriangleWarning } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { differenceInHours } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export interface LinkExpiryBannerProps {
  expiresAt?: string | Date | null;
  onExtend?: () => void;
  onDismiss?: () => void;
  className?: string;
  show?: boolean;
  children?: React.ReactNode;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  onDismiss,
  className,
  show = true,
  children,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const isExpiringSoon = expiresAt
    ? (() => {
        const hours = differenceInHours(new Date(expiresAt), new Date());
        return hours >= 0 && hours <= 24;
      })()
    : true;

  if (dismissed || !show || !isExpiringSoon) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("overflow-hidden", className)}
      >
        <div className="relative flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:py-3 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-amber-200 bg-white p-1.5 shadow-sm shrink-0">
              <TriangleWarning className="size-4 text-amber-600" />
            </div>
            <div className="text-sm font-medium">
              {children || (
                <span>
                  This link expires within 24 hours and will no longer be accessible once expired.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:shrink-0">
            {onExtend && (
              <Button
                variant="secondary"
                onClick={onExtend}
                className="h-8 rounded-lg border-amber-300 bg-white px-3 text-xs font-medium text-amber-900 hover:bg-amber-100"
              >
                Extend expiration
              </Button>
            )}
            <Button
              variant="outline"
              icon={<X className="size-4" />}
              className="size-8 rounded-lg border-amber-200 bg-white/50 p-0 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
              onClick={handleDismiss}
              aria-label="Close"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
