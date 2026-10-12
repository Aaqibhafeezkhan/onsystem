"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import { CopyIcon, RedoIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageToolbarProps = {
  className?: string;
  disabled?: boolean;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbUp?: () => void;
  onThumbDown?: () => void;
};

function PureMessageToolbar({
  className,
  disabled,
  isUpvoted,
  isDownvoted,
  onCopy,
  onRegenerate,
  onThumbUp,
  onThumbDown,
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
        onClick={onThumbUp}
        tooltip="Good response"
      >
        <ThumbUpIcon />
      </Action>
      <Action
        aria-pressed={isDownvoted}
        className={cn(buttonClass, isDownvoted && "text-foreground")}
        disabled={disabled || isDownvoted}
        onClick={onThumbDown}
        tooltip="Bad response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}

export const MessageToolbar = memo(PureMessageToolbar);
