"use client";

import type { ComponentProps } from "react";
import {
  MessageAction as Action,
  MessageActions as Actions,
} from "../ai-elements/message";
import {
  CopyIcon,
  ThumbDownIcon,
  ThumbUpIcon,
} from "./icons";
import { cn } from "@/lib/utils";

export type MessageToolbarProps = Omit<ComponentProps<"div">, "children"> & {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
};

export function MessageToolbar({
  className,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  ...props
}: MessageToolbarProps) {
  return (
    <Actions
      className={cn("mt-1 gap-0.5 text-muted-foreground/60", className)}
      {...props}
    >
      <Action
        aria-label="Copy message"
        className="size-7 hover:text-foreground"
        onClick={onCopy}
        tooltip="Copy"
      >
        <CopyIcon />
      </Action>
      <Action
        aria-label="Regenerate response"
        className="size-7 hover:text-foreground"
        onClick={onRegenerate}
        tooltip="Regenerate"
      >
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 16 16"
        >
          <path d="M13.5 5.5V2.5m0 0h-3m3 0-2.1 2.1a5 5 0 1 0 1.3 5.2" />
        </svg>
      </Action>
      <Action
        aria-label="Good response"
        className="size-7 hover:text-foreground"
        onClick={onThumbsUp}
        tooltip="Good response"
      >
        <ThumbUpIcon />
      </Action>
      <Action
        aria-label="Bad response"
        className="size-7 hover:text-foreground"
        onClick={onThumbsDown}
        tooltip="Bad response"
      >
        <ThumbDownIcon />
      </Action>
    </Actions>
  );
}
