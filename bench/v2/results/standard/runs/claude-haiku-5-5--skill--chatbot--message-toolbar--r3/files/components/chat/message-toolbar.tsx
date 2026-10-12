"use client";

import { RefreshCwIcon, ThumbsDownIcon, ThumbsUpIcon, CopyIcon } from "lucide-react";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import { cn } from "@/lib/utils";

export type MessageVote = "up" | "down" | null;

export type MessageToolbarProps = {
  className?: string;
  /** Current feedback for this message, used to show the pressed thumb. */
  vote?: MessageVote;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onVote?: (vote: Exclude<MessageVote, null>) => void;
};

const iconButtonClassName = "text-muted-foreground/50 hover:text-foreground";

export function MessageToolbar({
  className,
  vote = null,
  onCopy,
  onRegenerate,
  onVote,
}: MessageToolbarProps) {
  return (
    <Actions className={cn("-ml-0.5", className)}>
      <Action
        aria-label="Copy"
        className={iconButtonClassName}
        onClick={onCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>

      <Action
        aria-label="Regenerate"
        className={iconButtonClassName}
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RefreshCwIcon />
      </Action>

      <Action
        aria-label="Good response"
        aria-pressed={vote === "up"}
        className={cn(
          iconButtonClassName,
          vote === "up" && "text-foreground"
        )}
        onClick={() => onVote?.("up")}
        tooltip="Good response"
      >
        <ThumbsUpIcon />
      </Action>

      <Action
        aria-label="Bad response"
        aria-pressed={vote === "down"}
        className={cn(
          iconButtonClassName,
          vote === "down" && "text-foreground"
        )}
        onClick={() => onVote?.("down")}
        tooltip="Bad response"
      >
        <ThumbsDownIcon />
      </Action>
    </Actions>
  );
}
