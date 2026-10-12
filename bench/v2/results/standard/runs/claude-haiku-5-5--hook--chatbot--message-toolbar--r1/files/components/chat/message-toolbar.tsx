import { RefreshCwIcon } from "lucide-react";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageVote = "up" | "down" | null;

export type MessageToolbarProps = {
  className?: string;
  /** Current feedback state for this message, used to highlight the active thumb. */
  vote?: MessageVote;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onVote?: (vote: Exclude<MessageVote, null>) => void;
  disabled?: boolean;
};

const buttonClassName =
  "text-muted-foreground/50 hover:text-foreground aria-pressed:text-foreground";

export function MessageToolbar({
  className,
  vote = null,
  onCopy,
  onRegenerate,
  onVote,
  disabled = false,
}: MessageToolbarProps) {
  return (
    <Actions
      className={
        className ?? "-ml-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 focus-within:opacity-100"
      }
    >
      <Action
        aria-label="Copy"
        className={buttonClassName}
        disabled={disabled}
        onClick={onCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>

      <Action
        aria-label="Regenerate"
        className={buttonClassName}
        disabled={disabled}
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <RefreshCwIcon />
      </Action>

      <Action
        aria-label="Upvote response"
        aria-pressed={vote === "up"}
        className={buttonClassName}
        disabled={disabled || vote === "up"}
        onClick={() => onVote?.("up")}
        tooltip="Upvote Response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        aria-label="Downvote response"
        aria-pressed={vote === "down"}
        className={buttonClassName}
        disabled={disabled || vote === "down"}
        onClick={() => onVote?.("down")}
        tooltip="Downvote Response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}
