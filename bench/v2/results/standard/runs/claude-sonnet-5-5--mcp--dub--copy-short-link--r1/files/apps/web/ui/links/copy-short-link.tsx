"use client";

import { Button, Input } from "@dub/ui";
import { Copy, Tick } from "@dub/ui/icons";
import { useEffect, useRef, useState } from "react";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeout.current), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortLink);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        readOnly
        value={shortLink}
        aria-label="Short link"
        onFocus={(e) => e.currentTarget.select()}
      />
      <Button
        type="button"
        variant="secondary"
        className="w-10 shrink-0 px-0"
        icon={
          copied ? <Tick className="size-4" /> : <Copy className="size-4" />
        }
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy"}
        onClick={handleCopy}
      />
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
