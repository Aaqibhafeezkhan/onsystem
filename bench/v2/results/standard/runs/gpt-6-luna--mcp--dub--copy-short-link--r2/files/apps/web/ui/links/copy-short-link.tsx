"use client";

import { Button, Input } from "@dub/ui";
import { Check, Copy } from "@dub/ui/icons";
import { useEffect, useRef, useState } from "react";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortLink);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy short link:", error);
    }
  };

  return (
    <div className="flex w-full items-center gap-2">
      <Input
        aria-label="Short link"
        className="min-w-0 max-w-none flex-1 truncate"
        readOnly
        value={shortLink}
      />
      <Button
        aria-label={copied ? "Copied" : "Copy short link"}
        className="size-9 shrink-0 rounded-md p-0"
        icon={
          copied ? (
            <Check aria-hidden className="size-4" />
          ) : (
            <Copy aria-hidden className="size-4" />
          )
        }
        onClick={handleCopy}
        title={copied ? "Copied" : "Copy short link"}
        type="button"
        variant="secondary"
      />
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
