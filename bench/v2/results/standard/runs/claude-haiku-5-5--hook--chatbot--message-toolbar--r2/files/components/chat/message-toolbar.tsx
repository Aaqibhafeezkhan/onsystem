"use client";

import { RefreshCcwIcon } from "lucide-react";
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
  /** Current vote for this message, used to show the thumb buttons as pressed. */
  vote?: MessageVote;
  /** Called when the regenerate button is clicked. */
  onRegenerate?: () => void;
  /** Called with the chosen direction when a thumb button is clicked. */
  onVote?: (vote: Exclude<MessageVote, null>) => void;
  /** Disables all actions, e.g. while the response is still streaming. */
  disabled?: boolean;
  className?: string;
};

const iconButtonClassName =
  "text-muted-foreground/50 hover:text-foreground disabled:opacity-40";

export function MessageToolbar({
  text,
  vote = null,
  onRegenerate,
  onVote,
  disabled = false,
  className,
}: MessageToolbarProps) {
  const [, copyToClipboard] = useCopyToClipboard();

  const handleCopy = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(trimmed);
    toast.success("Copied to clipboard!");
  }, [copyToClipboard, text]);

  const isUpvoted = vote === "up";
  const isDownvoted = vote === "down";

  return (
    <Actions className={cn("-ml-0.5 flex items-center gap-0.5", className)}>
      <Action
        className={iconButtonClassName}
        disabled={disabled}
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>

      <Action
        className={iconButtonClassName}
        disabled={disabled || !onRegenerate}
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RefreshCcwIcon size={16} />
      </Action>

      <Action
        aria-pressed={isUpvoted}
        className={cn(
          iconButtonClassName,
          isUpvoted && "text-foreground"
        )}
        disabled={disabled || !onVote}
        onClick={() => onVote?.("up")}
        tooltip="Upvote response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        aria-pressed={isDownvoted}
        className={cn(
          iconButtonClassName,
          isDownvoted && "text-foreground"
        )}
        disabled={disabled || !onVote}
        onClick={() => onVote?.("down")}
        tooltip="Downvote response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}
