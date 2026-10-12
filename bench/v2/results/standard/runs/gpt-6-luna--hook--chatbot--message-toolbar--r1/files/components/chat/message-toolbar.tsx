"use client";

import { RotateCcwIcon } from "lucide-react";
import { MessageAction, MessageActions } from "../ai-elements/message";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageToolbarProps = {
  /** Text to copy when a custom copy handler is not provided. */
  text?: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  isRegenerating?: boolean;
  vote?: "up" | "down" | null;
};

export function MessageToolbar({
  text = "",
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  isRegenerating = false,
  vote = null,
}: MessageToolbarProps) {
  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      return;
    }

    if (text && typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
  };

  return (
    <MessageActions
      aria-label="Assistant message actions"
      className="-ml-0.5 text-muted-foreground/70"
    >
      <MessageAction
        className="hover:text-foreground"
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </MessageAction>
      <MessageAction
        className="hover:text-foreground"
        disabled={isRegenerating}
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RotateCcwIcon />
      </MessageAction>
      <MessageAction
        aria-pressed={vote === "up"}
        className="hover:text-foreground"
        onClick={onThumbsUp}
        tooltip="Good response"
      >
        <ThumbUpIcon />
      </MessageAction>
      <MessageAction
        aria-pressed={vote === "down"}
        className="hover:text-foreground"
        onClick={onThumbsDown}
        tooltip="Bad response"
      >
        <ThumbDownIcon />
      </MessageAction>
    </MessageActions>
  );
}
