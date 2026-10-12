"use client";

import type { ComponentProps } from "react";
import { RefreshCw } from "lucide-react";
import {
  MessageAction,
  MessageActions,
} from "../ai-elements/message";
import {
  CopyIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from "./icons";

export type MessageToolbarProps = Omit<ComponentProps<"div">, "children"> & {
  /** Text to copy when no custom copy handler is supplied. */
  text?: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  disabled?: boolean;
};

export function MessageToolbar({
  text,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  disabled = false,
  className,
  ...props
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
      className={`mt-1 gap-0.5 text-muted-foreground ${className ?? ""}`}
      {...props}
    >
      <MessageAction
        aria-label="Copy message"
        className="text-muted-foreground hover:text-foreground"
        disabled={disabled || (!onCopy && !text)}
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon size={15} />
      </MessageAction>
      <MessageAction
        aria-label="Regenerate response"
        className="text-muted-foreground hover:text-foreground"
        disabled={disabled || !onRegenerate}
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RefreshCw aria-hidden="true" size={15} />
      </MessageAction>
      <MessageAction
        aria-label="Like response"
        className="text-muted-foreground hover:text-foreground"
        disabled={disabled || !onThumbsUp}
        onClick={onThumbsUp}
        tooltip="Good response"
      >
        <ThumbUpIcon size={15} />
      </MessageAction>
      <MessageAction
        aria-label="Dislike response"
        className="text-muted-foreground hover:text-foreground"
        disabled={disabled || !onThumbsDown}
        onClick={onThumbsDown}
        tooltip="Bad response"
      >
        <ThumbDownIcon size={15} />
      </MessageAction>
    </MessageActions>
  );
}
