"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CopyIcon, RedoIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageToolbarProps = ComponentProps<"div"> & {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
};

export function MessageToolbar({
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  isUpvoted,
  isDownvoted,
  className,
  ...props
}: MessageToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground/50 hover:text-foreground"
              onClick={onCopy}
              type="button"
            >
              <CopyIcon />
              <span className="sr-only">Copy</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground/50 hover:text-foreground"
              onClick={onRegenerate}
              type="button"
            >
              <RedoIcon />
              <span className="sr-only">Regenerate</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Regenerate</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground/50 hover:text-foreground"
              onClick={onThumbsUp}
              disabled={isUpvoted}
              type="button"
            >
              <ThumbUpIcon />
              <span className="sr-only">Thumbs up</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upvote Response</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground/50 hover:text-foreground"
              onClick={onThumbsDown}
              disabled={isDownvoted}
              type="button"
            >
              <ThumbDownIcon />
              <span className="sr-only">Thumbs down</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Downvote Response</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
