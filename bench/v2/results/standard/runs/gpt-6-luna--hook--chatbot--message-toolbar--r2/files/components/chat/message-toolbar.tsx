"use client";

import {
  CopyIcon,
  RotateCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "@/components/ai-elements/message";

export type MessageToolbarProps = ComponentProps<"div"> & {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
};

export function MessageToolbar({
  className,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  ...props
}: MessageToolbarProps) {
  return (
    <Actions
      className={className}
      {...props}
    >
      <Action className="text-muted-foreground hover:text-foreground" onClick={onCopy} tooltip="Copy">
        <CopyIcon />
      </Action>
      <Action
        className="text-muted-foreground hover:text-foreground"
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RotateCcwIcon />
      </Action>
      <Action
        className="text-muted-foreground hover:text-foreground"
        onClick={onThumbsUp}
        tooltip="Good response"
      >
        <ThumbsUpIcon />
      </Action>
      <Action
        className="text-muted-foreground hover:text-foreground"
        onClick={onThumbsDown}
        tooltip="Bad response"
      >
        <ThumbsDownIcon />
      </Action>
    </Actions>
  );
}
