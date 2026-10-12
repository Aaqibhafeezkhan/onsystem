"use client";

import { RefreshCwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageVote = "up" | "down" | null;

export type MessageToolbarProps = {
  vote?: MessageVote;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onUpvote?: () => void;
  onDownvote?: () => void;
  className?: string;
};

export function MessageToolbar({
  vote = null,
  onCopy,
  onRegenerate,
  onUpvote,
  onDownvote,
  className,
}: MessageToolbarProps) {
  return (
    <Actions
      className={cn(
        "-ml-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 focus-within:opacity-100",
        className
      )}
    >
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        label="Copy"
        onClick={onCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        label="Regenerate"
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RefreshCwIcon />
      </Action>

      <Action
        aria-pressed={vote === "up"}
        className={
          vote === "up"
            ? "text-foreground"
            : "text-muted-foreground/50 hover:text-foreground"
        }
        label="Upvote response"
        onClick={onUpvote}
        tooltip="Upvote response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        aria-pressed={vote === "down"}
        className={
          vote === "down"
            ? "text-foreground"
            : "text-muted-foreground/50 hover:text-foreground"
        }
        label="Downvote response"
        onClick={onDownvote}
        tooltip="Downvote response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}
