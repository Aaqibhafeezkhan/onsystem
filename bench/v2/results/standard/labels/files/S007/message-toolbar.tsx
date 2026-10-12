"use client";

import { CopyIcon, RefreshCcwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import {
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";

export type MessageToolbarProps = {
  text?: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  vote?: "up" | "down" | null;
  disabled?: boolean;
  className?: string;
};

export function MessageToolbar({
  text = "",
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  vote = null,
  disabled = false,
  className,
}: MessageToolbarProps) {
  const [, copyToClipboard] = useCopyToClipboard();

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
      return;
    }

    try {
      const copied = await copyToClipboard(text);
      if (copied) {
        toast.success("Copied to clipboard!");
      } else {
        toast.error("Failed to copy response.");
      }
    } catch {
      toast.error("Failed to copy response.");
    }
  };

  const actionClassName =
    "text-muted-foreground/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-muted aria-pressed:text-foreground";

  return (
    <MessageActions
      aria-label="Assistant message actions"
      className={cn("-ml-0.5 mt-2", className)}
      role="group"
    >
      <MessageAction
        className={actionClassName}
        disabled={disabled || (!onCopy && !text.trim())}
        label="Copy response"
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon aria-hidden="true" />
      </MessageAction>
      <MessageAction
        className={actionClassName}
        disabled={disabled || !onRegenerate}
        label="Regenerate response"
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RefreshCcwIcon aria-hidden="true" />
      </MessageAction>
      <MessageAction
        aria-pressed={vote === "up"}
        className={actionClassName}
        disabled={disabled || !onThumbsUp}
        label="Thumbs up"
        onClick={onThumbsUp}
        tooltip="Thumbs up"
      >
        <ThumbsUpIcon aria-hidden="true" />
      </MessageAction>
      <MessageAction
        aria-pressed={vote === "down"}
        className={actionClassName}
        disabled={disabled || !onThumbsDown}
        label="Thumbs down"
        onClick={onThumbsDown}
        tooltip="Thumbs down"
      >
        <ThumbsDownIcon aria-hidden="true" />
      </MessageAction>
    </MessageActions>
  );
}
