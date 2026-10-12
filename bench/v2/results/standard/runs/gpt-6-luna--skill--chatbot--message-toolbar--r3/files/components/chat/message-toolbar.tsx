"use client";

import { RotateCcw } from "lucide-react";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "@/components/ai-elements/message";
import {
  CopyIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from "@/components/chat/icons";

type MessageToolbarProps = {
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
}: MessageToolbarProps) {
  return (
    <Actions className="-ml-0.5">
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onRegenerate}
        tooltip="Regenerate response"
      >
        <RotateCcw />
      </Action>
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onThumbsUp}
        tooltip="Good response"
      >
        <ThumbUpIcon />
      </Action>
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onThumbsDown}
        tooltip="Bad response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}
