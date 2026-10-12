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
  className?: string;
  /** Current feedback state for this message, used to show the selected thumb. */
  vote?: MessageVote;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onUpvote?: () => void;
  onDownvote?: () => void;
};

const actionClassName =
  "size-7 text-muted-foreground/50 hover:text-foreground aria-pressed:text-foreground";

export function MessageToolbar({
  className,
  vote = null,
  onCopy,
  onRegenerate,
  onUpvote,
  onDownvote,
}: MessageToolbarProps) {
  return (
    <Actions className={cn("-ml-0.5", className)}>
      <Action className={actionClassName} onClick={onCopy} tooltip="Copy">
        <CopyIcon />
      </Action>

      <Action
        className={actionClassName}
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RefreshCwIcon />
      </Action>

      <Action
        aria-pressed={vote === "up"}
        className={actionClassName}
        onClick={onUpvote}
        tooltip="Upvote response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        aria-pressed={vote === "down"}
        className={actionClassName}
        onClick={onDownvote}
        tooltip="Downvote response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}
