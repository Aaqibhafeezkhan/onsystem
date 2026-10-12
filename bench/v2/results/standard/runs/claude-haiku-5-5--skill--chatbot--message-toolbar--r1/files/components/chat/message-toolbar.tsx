"use client";

import { RefreshCwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageToolbarVote = "up" | "down" | null;

export type MessageToolbarProps = {
  className?: string;
  vote?: MessageToolbarVote;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onVote?: (vote: Exclude<MessageToolbarVote, null>) => void;
};

const actionClassName =
  "text-muted-foreground/50 hover:text-foreground aria-pressed:text-foreground";

export function MessageToolbar({
  className,
  vote = null,
  onCopy,
  onRegenerate,
  onVote,
}: MessageToolbarProps) {
  return (
    <Actions
      className={cn(
        "-ml-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 focus-within:opacity-100",
        className
      )}
    >
      <Action
        aria-label="Copy"
        className={actionClassName}
        onClick={onCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>

      <Action
        aria-label="Regenerate"
        className={actionClassName}
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RefreshCwIcon />
      </Action>

      <Action
        aria-label="Upvote response"
        aria-pressed={vote === "up"}
        className={actionClassName}
        onClick={() => onVote?.("up")}
        tooltip="Upvote response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        aria-label="Downvote response"
        aria-pressed={vote === "down"}
        className={actionClassName}
        onClick={() => onVote?.("down")}
        tooltip="Downvote response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}
