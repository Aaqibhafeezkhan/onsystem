"use client";

import type { ComponentProps } from "react";
import { RotateCcw } from "lucide-react";
import type { Vote } from "@/lib/db/schema";
import {
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "@/components/chat/icons";
import { cn } from "@/lib/utils";

export type MessageToolbarProps = ComponentProps<typeof MessageActions> & {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbUp?: () => void;
  onThumbDown?: () => void;
  onUpvote?: () => void;
  onDownvote?: () => void;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  vote?: Vote;
  isLoading?: boolean;
};

export function MessageToolbar({
  onCopy,
  onRegenerate,
  onThumbUp,
  onThumbDown,
  onUpvote,
  onDownvote,
  isUpvoted,
  isDownvoted,
  vote,
  isLoading,
  className,
  ...props
}: MessageToolbarProps) {
  if (isLoading) {
    return null;
  }

  const handleCopy = onCopy ?? (() => {});
  const handleRegenerate = onRegenerate ?? (() => {});
  const handleThumbUp = onThumbUp ?? onUpvote ?? (() => {});
  const handleThumbDown = onThumbDown ?? onDownvote ?? (() => {});

  const upvoted = vote?.isUpvoted ?? isUpvoted;
  const downvoted = (vote && !vote.isUpvoted) ?? isDownvoted;

  return (
    <MessageActions
      className={cn(
        "text-muted-foreground/50 hover:text-foreground",
        className
      )}
      {...props}
    >
      <MessageAction
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </MessageAction>

      <MessageAction
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={handleRegenerate}
        tooltip="Regenerate"
      >
        <RotateCcw className="size-4" />
      </MessageAction>

      <MessageAction
        className="text-muted-foreground/50 hover:text-foreground"
        data-testid="message-upvote"
        disabled={upvoted}
        onClick={handleThumbUp}
        tooltip="Thumbs up"
      >
        <ThumbUpIcon />
      </MessageAction>

      <MessageAction
        className="text-muted-foreground/50 hover:text-foreground"
        data-testid="message-downvote"
        disabled={downvoted}
        onClick={handleThumbDown}
        tooltip="Thumbs down"
      >
        <ThumbDownIcon />
      </MessageAction>
    </MessageActions>
  );
}
