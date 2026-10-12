"use client";

import { Button, Copy, Input, Tick } from "@dub/ui";
import { useEffect, useRef, useState } from "react";

const COPIED_DURATION_MS = 2000;

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  // Clear any pending reset when the component unmounts
  useEffect(() => clearTimer, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortLink);
    } catch (error) {
      console.error("Failed to copy: ", error);
      return;
    }

    clearTimer();
    setCopied(true);
    timer.current = setTimeout(() => {
      setCopied(false);
      timer.current = null;
    }, COPIED_DURATION_MS);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={shortLink}
        readOnly
        aria-label="Short link"
        onFocus={(e) => e.currentTarget.select()}
        className="font-mono"
      />
      <Button
        variant="secondary"
        type="button"
        onClick={handleCopy}
        icon={copied ? <Tick className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        aria-label={copied ? "Copied" : "Copy short link"}
        className="w-auto shrink-0 px-2"
      />
      <span role="status" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
