"use client";

import {
  CopyIcon,
  RefreshCwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function MessageToolbar({
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
}: {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
}) {
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Button
        aria-label="Copy"
        onClick={onCopy}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <CopyIcon />
      </Button>
      <Button
        aria-label="Regenerate"
        onClick={onRegenerate}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <RefreshCwIcon />
      </Button>
      <Button
        aria-label="Thumbs up"
        onClick={onThumbsUp}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <ThumbsUpIcon />
      </Button>
      <Button
        aria-label="Thumbs down"
        onClick={onThumbsDown}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <ThumbsDownIcon />
      </Button>
    </div>
  );
}
