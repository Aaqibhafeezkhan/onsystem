"use client";

import { RotateCcwIcon } from "lucide-react";
import type { ComponentProps } from "react";
import {
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageToolbarProps = Omit<
  ComponentProps<typeof MessageActions>,
  "children"
> & {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  disabled?: boolean;
  feedback?: "up" | "down" | null;
};

/** Place below an assistant message; action behavior is supplied by the caller. */
export function MessageToolbar({
  className,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  disabled = false,
  feedback = null,
  ...props
}: MessageToolbarProps) {
  const actionClassName =
    "text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-muted aria-pressed:text-foreground";

  return (
    <MessageActions
      aria-label="Assistant message actions"
      className={cn("mt-2 w-fit gap-1", className)}
      role="group"
      {...props}
    >
      <MessageAction
        className={actionClassName}
        disabled={disabled || !onCopy}
        onClick={onCopy}
        tooltip="Copy message"
      >
        <CopyIcon />
      </MessageAction>
      <MessageAction
        className={actionClassName}
        disabled={disabled || !onRegenerate}
        onClick={onRegenerate}
        tooltip="Regenerate response"
      >
        <RotateCcwIcon aria-hidden="true" />
      </MessageAction>
      <MessageAction
        aria-pressed={feedback === "up"}
        className={actionClassName}
        disabled={disabled || !onThumbsUp}
        onClick={onThumbsUp}
        tooltip="Thumbs up"
      >
        <ThumbUpIcon />
      </MessageAction>
      <MessageAction
        aria-pressed={feedback === "down"}
        className={actionClassName}
        disabled={disabled || !onThumbsDown}
        onClick={onThumbsDown}
        tooltip="Thumbs down"
      >
        <ThumbDownIcon />
      </MessageAction>
    </MessageActions>
  );
}
