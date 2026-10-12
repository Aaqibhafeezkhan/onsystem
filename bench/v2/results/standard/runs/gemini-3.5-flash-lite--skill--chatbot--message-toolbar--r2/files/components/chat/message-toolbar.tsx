"use client";

import { RotateCcw } from "lucide-react";
import type { ComponentProps } from "react";
import {
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "@/components/chat/icons";
import { cn } from "@/lib/utils";

export type MessageToolbarProps = ComponentProps<typeof MessageActions> & {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
};

export function MessageToolbar({
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  isUpvoted,
  isDownvoted,
  className,
  children,
  ...props
}: MessageToolbarProps) {
  return (
    <MessageActions
      className={cn("text-muted-foreground/50", className)}
      {...props}
    >
      {children ?? (
        <>
          <MessageAction
            className="hover:text-foreground"
            onClick={onCopy}
            tooltip="Copy"
          >
            <CopyIcon />
          </MessageAction>

          <MessageAction
            className="hover:text-foreground"
            onClick={onRegenerate}
            tooltip="Regenerate"
          >
            <RotateCcw />
          </MessageAction>

          <MessageAction
            className="hover:text-foreground"
            disabled={isUpvoted}
            onClick={onThumbsUp}
            tooltip="Thumbs up"
          >
            <ThumbUpIcon />
          </MessageAction>

          <MessageAction
            className="hover:text-foreground"
            disabled={isDownvoted}
            onClick={onThumbsDown}
            tooltip="Thumbs down"
          >
            <ThumbDownIcon />
          </MessageAction>
        </>
      )}
    </MessageActions>
  );
}
