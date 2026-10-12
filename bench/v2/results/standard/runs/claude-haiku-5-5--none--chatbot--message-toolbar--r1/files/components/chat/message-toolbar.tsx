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

export type MessageToolbarProps = {
  /** Plain text of the assistant message, copied by the copy button. */
  text: string;
  /** Current vote for this message, used to show the pressed state. */
  vote?: "up" | "down" | null;
  /** Called when the user clicks regenerate. Button is hidden when omitted. */
  onRegenerate?: () => void;
  /** Called when the user votes. Clicking the active vote again is a no-op. */
  onVote?: (type: "up" | "down") => void;
  className?: string;
};

const buttonClassName =
  "text-muted-foreground/50 hover:text-foreground aria-pressed:text-foreground";

export function MessageToolbar({
  text,
  vote = null,
  onRegenerate,
  onVote,
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

  const handleVote = useCallback(
    (type: "up" | "down") => {
      if (vote === type) {
        return;
      }
      onVote?.(type);
    },
    [onVote, vote]
  );

  return (
    <Actions
      className={cn(
        "-ml-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 focus-within:opacity-100",
        className
      )}
    >
      <Action
        aria-label="Copy"
        className={buttonClassName}
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>

      {onRegenerate ? (
        <Action
          aria-label="Regenerate"
          className={buttonClassName}
          onClick={onRegenerate}
          tooltip="Regenerate"
        >
          <RefreshCcwIcon />
        </Action>
      ) : null}

      <Action
        aria-label="Upvote response"
        aria-pressed={vote === "up"}
        className={buttonClassName}
        disabled={!onVote}
        onClick={() => handleVote("up")}
        tooltip="Upvote response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        aria-label="Downvote response"
        aria-pressed={vote === "down"}
        className={buttonClassName}
        disabled={!onVote}
        onClick={() => handleVote("down")}
        tooltip="Downvote response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}
