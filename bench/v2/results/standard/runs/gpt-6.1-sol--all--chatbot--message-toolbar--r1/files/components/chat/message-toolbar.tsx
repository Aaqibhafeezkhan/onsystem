"use client";

import { CopyIcon, RefreshCwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MessageToolbarProps = {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  vote?: "up" | "down" | null;
  disabled?: boolean;
  className?: string;
};

export function MessageToolbar({
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  vote,
  disabled = false,
  className,
}: MessageToolbarProps) {
  return (
    <div
      aria-label="Assistant message actions"
      className={cn("mt-2 flex items-center gap-1 text-muted-foreground", className)}
      role="group"
    >
      <Button
        aria-label="Copy message"
        disabled={disabled || !onCopy}
        onClick={onCopy}
        size="icon-sm"
        title="Copy message"
        type="button"
        variant="ghost"
      >
        <CopyIcon aria-hidden="true" />
      </Button>
      <Button
        aria-label="Regenerate response"
        disabled={disabled || !onRegenerate}
        onClick={onRegenerate}
        size="icon-sm"
        title="Regenerate response"
        type="button"
        variant="ghost"
      >
        <RefreshCwIcon aria-hidden="true" />
      </Button>
      <Button
        aria-label="Thumbs up"
        aria-pressed={vote === "up"}
        disabled={disabled || !onThumbsUp}
        onClick={onThumbsUp}
        size="icon-sm"
        title="Thumbs up"
        type="button"
        variant={vote === "up" ? "secondary" : "ghost"}
      >
        <ThumbsUpIcon aria-hidden="true" />
      </Button>
      <Button
        aria-label="Thumbs down"
        aria-pressed={vote === "down"}
        disabled={disabled || !onThumbsDown}
        onClick={onThumbsDown}
        size="icon-sm"
        title="Thumbs down"
        type="button"
        variant={vote === "down" ? "secondary" : "ghost"}
      >
        <ThumbsDownIcon aria-hidden="true" />
      </Button>
    </div>
  );
}
