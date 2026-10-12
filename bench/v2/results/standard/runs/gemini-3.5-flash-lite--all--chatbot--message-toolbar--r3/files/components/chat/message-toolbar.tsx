"use client";

import type { ComponentProps } from "react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import {
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import {
  CopyIcon,
  RedoIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from "@/components/chat/icons";

export type MessageToolbarProps = ComponentProps<typeof MessageActions> & {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onUpvote?: () => void;
  onDownvote?: () => void;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  isLoading?: boolean;
};

function PureMessageToolbar({
  className,
  onCopy,
  onRegenerate,
  onUpvote,
  onDownvote,
  isUpvoted,
  isDownvoted,
  isLoading,
  children,
  ...props
}: MessageToolbarProps) {
  if (isLoading) {
    return null;
  }

  return (
    <MessageActions
      className={cn(
        "-ml-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <MessageAction
            className="text-muted-foreground/50 hover:text-foreground"
            onClick={onCopy}
            tooltip="Copy"
          >
            <CopyIcon />
          </MessageAction>
          <MessageAction
            className="text-muted-foreground/50 hover:text-foreground"
            onClick={onRegenerate}
            tooltip="Regenerate"
          >
            <RedoIcon />
          </MessageAction>
          <MessageAction
            className="text-muted-foreground/50 hover:text-foreground"
            data-testid="message-upvote"
            disabled={isUpvoted}
            onClick={onUpvote}
            tooltip="Upvote Response"
          >
            <ThumbUpIcon />
          </MessageAction>
          <MessageAction
            className="text-muted-foreground/50 hover:text-foreground"
            data-testid="message-downvote"
            disabled={isDownvoted}
            onClick={onDownvote}
            tooltip="Downvote Response"
          >
            <ThumbDownIcon />
          </MessageAction>
        </>
      )}
    </MessageActions>
  );
}

export const MessageToolbar = memo(PureMessageToolbar);
MessageToolbar.displayName = "MessageToolbar";
