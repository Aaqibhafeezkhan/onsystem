"use client";

import { RefreshCwIcon } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { cn } from "@/lib/utils";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageVote = "up" | "down" | null;

export type MessageToolbarProps = {
  /** Plain text of the assistant message, copied by the copy button. */
  text: string;
  /** Current vote for this message, used to show the pressed state. */
  vote?: MessageVote;
  onVote?: (vote: "up" | "down") => void;
  onRegenerate?: () => void;
  disabled?: boolean;
  className?: string;
};

const actionClassName =
  "text-muted-foreground/50 hover:text-foreground aria-pressed:text-foreground";

export function MessageToolbar({
  text,
  vote = null,
  onVote,
  onRegenerate,
  disabled = false,
  className,
}: MessageToolbarProps) {
  const [, copyToClipboard] = useCopyToClipboard();

  const trimmed = text.trim();

  const handleCopy = useCallback(async () => {
    if (!trimmed) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(trimmed);
    toast.success("Copied to clipboard!");
  }, [copyToClipboard, trimmed]);

  return (
    <Actions className={cn("-ml-0.5", className)}>
      <Action
        aria-label="Copy"
        className={actionClassName}
        disabled={disabled}
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>

      <Action
        aria-label="Regenerate"
        className={actionClassName}
        disabled={disabled || !onRegenerate}
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RefreshCwIcon />
      </Action>

      <Action
        aria-label="Upvote response"
        aria-pressed={vote === "up"}
        className={actionClassName}
        disabled={disabled || !onVote}
        onClick={() => onVote?.("up")}
        tooltip="Upvote response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        aria-label="Downvote response"
        aria-pressed={vote === "down"}
        className={actionClassName}
        disabled={disabled || !onVote}
        onClick={() => onVote?.("down")}
        tooltip="Downvote response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}
