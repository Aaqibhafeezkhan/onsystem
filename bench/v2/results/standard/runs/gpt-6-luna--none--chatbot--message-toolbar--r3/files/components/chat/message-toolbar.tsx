"use client";

import { RotateCcw } from "lucide-react";
import type { ComponentProps } from "react";
import {
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

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
    <MessageActions
      className={cn("mt-2 gap-1 text-muted-foreground", className)}
      {...props}
    >
      <MessageAction onClick={onCopy} tooltip="Copy">
        <CopyIcon />
      </MessageAction>
      <MessageAction onClick={onRegenerate} tooltip="Regenerate">
        <RotateCcw />
      </MessageAction>
      <MessageAction onClick={onThumbsUp} tooltip="Good response">
        <ThumbUpIcon />
      </MessageAction>
      <MessageAction onClick={onThumbsDown} tooltip="Bad response">
        <ThumbDownIcon />
      </MessageAction>
    </MessageActions>
  );
}
