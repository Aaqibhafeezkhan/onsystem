"use client";

import { Button, Check, Copy, Input } from "@dub/ui";
import { useEffect, useRef, useState } from "react";

const COPIED_DURATION_MS = 2000;

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortLink);
    } catch {
      return;
    }

    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, COPIED_DURATION_MS);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        readOnly
        value={shortLink}
        aria-label="Short link"
        className="w-full"
        onFocus={(e) => e.currentTarget.select()}
      />
      <Button
        type="button"
        variant="secondary"
        onClick={handleCopy}
        icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy short link"}
        className="w-auto px-2"
      />
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
