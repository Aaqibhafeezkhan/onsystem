"use client";

import { Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MessageToolbarProps = {
  onCopy: () => void;
  onRegenerate: () => void;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  feedback?: "up" | "down" | null;
  disabled?: boolean;
};

export function MessageToolbar({
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  feedback = null,
  disabled = false,
}: MessageToolbarProps) {
  return (
    <div
      aria-label="Assistant message actions"
      className="mt-2 flex items-center gap-1 text-muted-foreground"
      role="group"
    >
      <Button
        aria-label="Copy message"
        disabled={disabled}
        onClick={onCopy}
        size="icon-sm"
        title="Copy message"
        type="button"
        variant="ghost"
      >
        <Copy aria-hidden="true" />
      </Button>
      <Button
        aria-label="Regenerate response"
        disabled={disabled}
        onClick={onRegenerate}
        size="icon-sm"
        title="Regenerate response"
        type="button"
        variant="ghost"
      >
        <RotateCcw aria-hidden="true" />
      </Button>
      <Button
        aria-label="Thumbs up"
        aria-pressed={feedback === "up"}
        disabled={disabled}
        onClick={onThumbsUp}
        size="icon-sm"
        title="Thumbs up"
        type="button"
        variant={feedback === "up" ? "secondary" : "ghost"}
      >
        <ThumbsUp aria-hidden="true" />
      </Button>
      <Button
        aria-label="Thumbs down"
        aria-pressed={feedback === "down"}
        disabled={disabled}
        onClick={onThumbsDown}
        size="icon-sm"
        title="Thumbs down"
        type="button"
        variant={feedback === "down" ? "secondary" : "ghost"}
      >
        <ThumbsDown aria-hidden="true" />
      </Button>
    </div>
  );
}
