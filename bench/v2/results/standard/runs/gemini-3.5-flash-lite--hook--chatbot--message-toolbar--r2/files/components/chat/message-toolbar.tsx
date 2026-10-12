"use client";

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
import { CopyIcon, RedoIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageToolbarProps = {
  chatId?: string;
  message?: ChatMessage;
  vote?: Vote;
  isLoading?: boolean;
  onCopy?: () => void | Promise<void>;
  onRegenerate?: () => void | Promise<void>;
  onUpvote?: () => void | Promise<void>;
  onDownvote?: () => void | Promise<void>;
  className?: string;
};

export function PureMessageToolbar({
  chatId,
  message,
  vote,
  isLoading,
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
      await onCopy();
      return;
    }

    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!");
  }, [copyToClipboard, onCopy, textFromParts]);

  const handleRegenerate = useCallback(async () => {
    if (onRegenerate) {
      await onRegenerate();
    }
  }, [onRegenerate]);

  const handleUpvote = useCallback(() => {
    if (onUpvote) {
      onUpvote();
      return;
    }

    if (!chatId || !message) {
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
  }, [chatId, message, mutate, onUpvote]);

  const handleDownvote = useCallback(() => {
    if (onDownvote) {
      onDownvote();
      return;
    }

    if (!chatId || !message) {
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
  }, [chatId, message, mutate, onDownvote]);

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
        onClick={handleCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>

      <Action
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={handleRegenerate}
        tooltip="Regenerate"
      >
        <RedoIcon />
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
    if (prevProps.className !== nextProps.className) {
      return false;
    }
    return true;
  }
);
