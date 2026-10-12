import equal from "fast-deep-equal";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import { ClockRewind, CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageToolbarProps = {
  chatId?: string;
  message?: ChatMessage;
  vote?: Vote | undefined;
  isLoading?: boolean;
  regenerate?: () => void;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onUpvote?: () => void;
  onDownvote?: () => void;
  className?: string;
};

export function PureMessageToolbar({
  chatId,
  message,
  vote,
  isLoading,
  regenerate,
  onCopy,
  onRegenerate,
  onUpvote,
  onDownvote,
  className,
}: MessageToolbarProps) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  const textFromParts = message?.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
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

    if (regenerate) {
      regenerate();
    }
  }, [onRegenerate, regenerate]);

  const handleUpvote = useCallback(() => {
    if (onUpvote) {
      onUpvote();
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
  }, [chatId, message?.id, mutate, onUpvote]);

  const handleDownvote = useCallback(() => {
    if (onDownvote) {
      onDownvote();
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
  }, [chatId, message?.id, mutate, onDownvote]);

  if (isLoading) {
    return null;
  }

  return (
    <Actions
      className={cn(
        "-ml-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100",
        className
      )}
    >
      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        data-testid="message-copy"
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        data-testid="message-regenerate"
        onClick={handleRegenerate}
        tooltip="Regenerate"
      >
        <ClockRewind />
      </Action>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        data-testid="message-upvote"
        disabled={vote?.isUpvoted}
        onClick={handleUpvote}
        tooltip="Upvote Response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        data-testid="message-downvote"
        disabled={vote && !vote.isUpvoted}
        onClick={handleDownvote}
        tooltip="Downvote Response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}

export const MessageToolbar = memo(
  PureMessageToolbar,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }

    return true;
  }
);
