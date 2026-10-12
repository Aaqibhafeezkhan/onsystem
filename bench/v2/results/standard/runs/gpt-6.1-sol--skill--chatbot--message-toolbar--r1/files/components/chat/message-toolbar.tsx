"use client";

import {
  CopyIcon,
  RefreshCwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import {
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";

export type MessageToolbarProps = {
  className?: string;
  disabled?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  vote?: "up" | "down" | null;
};

const actionClassName =
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function MessageToolbar({
  className,
  disabled = false,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  vote = null,
}: MessageToolbarProps) {
  return (
    <MessageActions
      aria-label="Assistant message actions"
      className={cn("mt-2 text-muted-foreground", className)}
      role="group"
    >
      <MessageAction
        aria-label="Copy message"
        className={actionClassName}
        disabled={disabled}
        onClick={onCopy}
        size="icon-sm"
        tooltip="Copy message"
        variant="ghost"
      >
        <CopyIcon aria-hidden="true" />
      </MessageAction>
      <MessageAction
        aria-label="Regenerate response"
        className={actionClassName}
        disabled={disabled}
        onClick={onRegenerate}
        size="icon-sm"
        tooltip="Regenerate response"
        variant="ghost"
      >
        <RefreshCwIcon aria-hidden="true" />
      </MessageAction>
      <MessageAction
        aria-label="Thumbs up"
        aria-pressed={vote === "up"}
        className={actionClassName}
        disabled={disabled}
        onClick={onThumbsUp}
        size="icon-sm"
        tooltip="Thumbs up"
        variant={vote === "up" ? "secondary" : "ghost"}
      >
        <ThumbsUpIcon aria-hidden="true" />
      </MessageAction>
      <MessageAction
        aria-label="Thumbs down"
        aria-pressed={vote === "down"}
        className={actionClassName}
        disabled={disabled}
        onClick={onThumbsDown}
        size="icon-sm"
        tooltip="Thumbs down"
        variant={vote === "down" ? "secondary" : "ghost"}
      >
        <ThumbsDownIcon aria-hidden="true" />
      </MessageAction>
    </MessageActions>
  );
}
