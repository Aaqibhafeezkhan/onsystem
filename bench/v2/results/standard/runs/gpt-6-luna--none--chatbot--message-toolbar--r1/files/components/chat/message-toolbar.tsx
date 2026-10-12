"use client";

import { RotateCcw } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import {
  MessageAction,
  MessageActions,
} from "../ai-elements/message";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

type MessageToolbarProps = {
  text: string;
  onRegenerate: () => void;
  onVote: (vote: "up" | "down") => void;
  vote?: "up" | "down" | null;
  isRegenerating?: boolean;
};

export function MessageToolbar({
  text,
  onRegenerate,
  onVote,
  vote = null,
  isRegenerating = false,
}: MessageToolbarProps) {
  const [_, copyToClipboard] = useCopyToClipboard();

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }, [copyToClipboard, text]);

  return (
    <MessageActions className="-ml-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100">
      <MessageAction
        aria-label="Copy message"
        className="text-muted-foreground/60 hover:text-foreground"
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </MessageAction>
      <MessageAction
        aria-label="Regenerate response"
        className="text-muted-foreground/60 hover:text-foreground"
        disabled={isRegenerating}
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RotateCcw aria-hidden="true" />
      </MessageAction>
      <MessageAction
        aria-label="Like response"
        aria-pressed={vote === "up"}
        className={
          vote === "up"
            ? "text-primary hover:text-primary"
            : "text-muted-foreground/60 hover:text-foreground"
        }
        onClick={() => onVote("up")}
        tooltip="Good response"
      >
        <ThumbUpIcon />
      </MessageAction>
      <MessageAction
        aria-label="Dislike response"
        aria-pressed={vote === "down"}
        className={
          vote === "down"
            ? "text-primary hover:text-primary"
            : "text-muted-foreground/60 hover:text-foreground"
        }
        onClick={() => onVote("down")}
        tooltip="Bad response"
      >
        <ThumbDownIcon />
      </MessageAction>
    </MessageActions>
  );
}
