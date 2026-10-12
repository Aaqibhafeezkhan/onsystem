"use client";

import type { ComponentProps } from "react";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "@/components/ai-elements/message";
import {
  CopyIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from "@/components/chat/icons";
import { RotateCcw } from "lucide-react";

type MessageToolbarProps = Omit<ComponentProps<typeof Actions>, "children"> & {
  onCopy: () => void;
  onRegenerate: () => void;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
};

export function MessageToolbar({
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  className,
  ...props
}: MessageToolbarProps) {
  return (
    <Actions
      className={`-ml-0.5 gap-1 ${className ?? ""}`.trim()}
      {...props}
    >
      <Action
        aria-label="Copy response"
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>
      <Action
        aria-label="Regenerate response"
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RotateCcw />
      </Action>
      <Action
        aria-label="Thumbs up"
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onThumbsUp}
        tooltip="Good response"
      >
        <ThumbUpIcon />
      </Action>
      <Action
        aria-label="Thumbs down"
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onThumbsDown}
        tooltip="Bad response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}
