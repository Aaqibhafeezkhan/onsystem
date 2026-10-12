"use client";

import { Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";

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
    <Actions aria-label="Assistant message actions" role="group">
      <Action onClick={onCopy} tooltip="Copy">
        <Copy aria-hidden="true" className="size-4" />
      </Action>
      <Action onClick={onRegenerate} tooltip="Regenerate">
        <RotateCcw aria-hidden="true" className="size-4" />
      </Action>
      <Action onClick={onThumbsUp} tooltip="Thumbs up">
        <ThumbsUp aria-hidden="true" className="size-4" />
      </Action>
      <Action onClick={onThumbsDown} tooltip="Thumbs down">
        <ThumbsDown aria-hidden="true" className="size-4" />
      </Action>
    </Actions>
  );
}
