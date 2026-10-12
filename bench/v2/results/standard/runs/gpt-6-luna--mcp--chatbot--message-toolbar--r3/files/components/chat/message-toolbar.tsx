"use client";

import { RotateCcw } from "lucide-react";
import {
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import {
  CopyIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from "@/components/chat/icons";

export type MessageToolbarProps = {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
};

export function MessageToolbar({
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
}: MessageToolbarProps) {
  return (
    <MessageActions className="text-muted-foreground">
      <MessageAction label="Copy" onClick={onCopy} tooltip="Copy">
        <CopyIcon />
      </MessageAction>
      <MessageAction
        label="Regenerate response"
        onClick={onRegenerate}
        tooltip="Regenerate response"
      >
        <RotateCcw aria-hidden="true" className="size-4" />
      </MessageAction>
      <MessageAction
        label="Thumbs up"
        onClick={onThumbsUp}
        tooltip="Good response"
      >
        <ThumbUpIcon />
      </MessageAction>
      <MessageAction
        label="Thumbs down"
        onClick={onThumbsDown}
        tooltip="Bad response"
      >
        <ThumbDownIcon />
      </MessageAction>
    </MessageActions>
  );
}
