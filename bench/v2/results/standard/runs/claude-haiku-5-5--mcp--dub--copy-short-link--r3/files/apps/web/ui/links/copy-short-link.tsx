"use client";

import { Button, Copy, Input, Tick } from "@dub/ui";
import { useEffect, useRef, useState } from "react";

const COPIED_DURATION_MS = 2000;

export function CopyShortLink({
  shortLink,
  className,
}: {
  shortLink: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortLink);
    } catch (error) {
      console.error("Failed to copy: ", error);
      return;
    }

    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      timer.current = null;
    }, COPIED_DURATION_MS);
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          readOnly
          value={shortLink}
          aria-label="Short link"
          className="min-w-0 flex-1 max-w-none"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleCopy}
          icon={
            copied ? (
              <Tick className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )
          }
          aria-label={copied ? "Copied" : "Copy short link"}
          title={copied ? "Copied" : "Copy short link"}
          className="w-auto shrink-0 px-2.5"
        />
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
