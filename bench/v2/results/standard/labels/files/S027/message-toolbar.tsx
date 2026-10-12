"use client";

import { cn } from "@/lib/utils";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import { CopyIcon, RedoIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageToolbarProps = {
  className?: string;
  onCopy: () => void;
  onRegenerate: () => void;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  disabled?: boolean;
};

export function MessageToolbar({
  className,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  isUpvoted,
  isDownvoted,
  disabled,
}: MessageToolbarProps) {
  const buttonClass = "text-muted-foreground/50 hover:text-foreground";

  return (
    <Actions className={cn("-ml-0.5", className)}>
      <Action
        className={buttonClass}
        disabled={disabled}
        onClick={onCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>
      <Action
        className={buttonClass}
        disabled={disabled}
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RedoIcon />
      </Action>
      <Action
        aria-pressed={isUpvoted}
        className={cn(buttonClass, isUpvoted && "text-foreground")}
        disabled={disabled || isUpvoted}
        onClick={onThumbsUp}
        tooltip="Good response"
      >
        <ThumbUpIcon />
      </Action>
      <Action
        aria-pressed={isDownvoted}
        className={cn(buttonClass, isDownvoted && "text-foreground")}
        disabled={disabled || isDownvoted}
        onClick={onThumbsDown}
        tooltip="Bad response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}
