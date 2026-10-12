import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import {
  MessageAction,
  MessageActions,
} from "../ai-elements/message";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageToolbarProps = {
  chatId?: string;
  message?: ChatMessage;
  vote?: Vote | undefined;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  regenerate?: () => void;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  textToCopy?: string;
  children?: React.ReactNode;
};

function PureMessageToolbar({
  chatId,
  message,
  vote,
  isUpvoted,
  isDownvoted,
  regenerate,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  isLoading = false,
  disabled = false,
  className,
  textToCopy,
  children,
}: MessageToolbarProps) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  const textFromParts =
    textToCopy ||
    message?.parts
      ?.filter((part) => part.type === "text")
      .map((part) => (part as { text: string }).text)
      .join("\n")
      .trim();

  const handleCopy = useCallback(async () => {
    if (onCopy) {
      onCopy();
      return;
    }

    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!");
  }, [copyToClipboard, onCopy, textFromParts]);

  const handleRegenerate = useCallback(() => {
    if (onRegenerate) {
      onRegenerate();
      return;
    }
    regenerate?.();
  }, [onRegenerate, regenerate]);

  const handleUpvote = useCallback(() => {
    if (onThumbsUp) {
      onThumbsUp();
      return;
    }

    if (!chatId || !message?.id) {
      return;
    }

    const upvote = fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote`,
      {
        body: JSON.stringify({
          chatId,
          messageId: message.id,
          type: "up",
        }),
        method: "PATCH",
      }
    );

    toast.promise(upvote, {
      error: "Failed to upvote response.",
      loading: "Upvoting Response...",
      success: () => {
        mutate<Vote[]>(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`,
          (currentVotes) => {
            if (!currentVotes) {
              return [];
            }

            const votesWithoutCurrent = currentVotes.filter(
              (currentVote) => currentVote.messageId !== message.id
            );

            return [
              ...votesWithoutCurrent,
              {
                chatId,
                isUpvoted: true,
                messageId: message.id,
              },
            ];
          },
          { revalidate: false }
        );

        return "Upvoted Response!";
      },
    });
  }, [chatId, message?.id, mutate, onThumbsUp]);

  const handleDownvote = useCallback(() => {
    if (onThumbsDown) {
      onThumbsDown();
      return;
    }

    if (!chatId || !message?.id) {
      return;
    }

    const downvote = fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote`,
      {
        body: JSON.stringify({
          chatId,
          messageId: message.id,
          type: "down",
        }),
        method: "PATCH",
      }
    );

    toast.promise(downvote, {
      error: "Failed to downvote response.",
      loading: "Downvoting Response...",
      success: () => {
        mutate<Vote[]>(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`,
          (currentVotes) => {
            if (!currentVotes) {
              return [];
            }

            const votesWithoutCurrent = currentVotes.filter(
              (currentVote) => currentVote.messageId !== message.id
            );

            return [
              ...votesWithoutCurrent,
              {
                chatId,
                isUpvoted: false,
                messageId: message.id,
              },
            ];
          },
          { revalidate: false }
        );

        return "Downvoted Response!";
      },
    });
  }, [chatId, message?.id, mutate, onThumbsDown]);

  if (isLoading) {
    return null;
  }

  const effectiveIsUpvoted = isUpvoted ?? vote?.isUpvoted;
  const effectiveIsDownvoted = isDownvoted ?? (vote && !vote.isUpvoted);

  return (
    <MessageActions
      className={cn(
        "text-muted-foreground/50 hover:text-foreground",
        className
      )}
    >
      {children ?? (
        <>
          <MessageAction
            className="text-muted-foreground/50 hover:text-foreground"
            disabled={disabled}
            onClick={handleCopy}
            tooltip="Copy"
          >
            <CopyIcon />
          </MessageAction>

          <MessageAction
            className="text-muted-foreground/50 hover:text-foreground"
            disabled={disabled}
            onClick={handleRegenerate}
            tooltip="Regenerate"
          >
            <RefreshCw className="size-4" />
          </MessageAction>

          <MessageAction
            className="text-muted-foreground/50 hover:text-foreground"
            data-testid="message-upvote"
            disabled={disabled || effectiveIsUpvoted}
            onClick={handleUpvote}
            tooltip="Upvote Response"
          >
            <ThumbUpIcon />
          </MessageAction>

          <MessageAction
            className="text-muted-foreground/50 hover:text-foreground"
            data-testid="message-downvote"
            disabled={disabled || effectiveIsDownvoted}
            onClick={handleDownvote}
            tooltip="Downvote Response"
          >
            <ThumbDownIcon />
          </MessageAction>
        </>
      )}
    </MessageActions>
  );
}

export const MessageToolbar = memo(PureMessageToolbar);
