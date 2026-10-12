"use client";

import { RefreshCwIcon } from "lucide-react";
import { MessageAction, MessageActions } from "@/components/ai-elements/message";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "@/components/chat/icons";
import { cn } from "@/lib/utils";

export type MessageToolbarVote = "up" | "down" | null;

export type MessageToolbarProps = {
  className?: string;
  /** Current feedback state for the message, used to highlight thumbs. */
  vote?: MessageToolbarVote;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onUpvote?: () => void;
  onDownvote?: () => void;
};

const iconButtonClassName = "text-muted-foreground/50 hover:text-foreground";

export function MessageToolbar({
  className,
  vote = null,
  onCopy,
  onRegenerate,
  onUpvote,
  onDownvote,
}: MessageToolbarProps) {
  return (
    <MessageActions
      className={cn("-ml-0.5 flex items-center gap-0.5", className)}
      role="toolbar"
      aria-label="Message actions"
    >
      <MessageAction
        className={iconButtonClassName}
        onClick={onCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </MessageAction>

      <MessageAction
        className={iconButtonClassName}
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RefreshCwIcon />
      </MessageAction>

      <MessageAction
        aria-pressed={vote === "up"}
        className={cn(
          iconButtonClassName,
          vote === "up" && "text-foreground"
        )}
        onClick={onUpvote}
        tooltip="Upvote Response"
      >
        <ThumbUpIcon />
      </MessageAction>

      <MessageAction
        aria-pressed={vote === "down"}
        className={cn(
          iconButtonClassName,
          vote === "down" && "text-foreground"
        )}
        onClick={onDownvote}
        tooltip="Downvote Response"
      >
        <ThumbDownIcon />
      </MessageAction>
    </MessageActions>
  );
}
