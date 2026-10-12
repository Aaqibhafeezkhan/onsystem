"use client";

import { RotateCcw } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

type MessageToolbarProps = Omit<ComponentProps<"div">, "children"> & {
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
    <div
      aria-label="Assistant message actions"
      className={cn("flex items-center gap-1", className)}
      role="group"
      {...props}
    >
      <Button
        aria-label="Copy message"
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onCopy}
        size="icon-sm"
        title="Copy message"
        type="button"
        variant="ghost"
      >
        <CopyIcon />
      </Button>
      <Button
        aria-label="Regenerate response"
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onRegenerate}
        size="icon-sm"
        title="Regenerate response"
        type="button"
        variant="ghost"
      >
        <RotateCcw aria-hidden="true" />
      </Button>
      <Button
        aria-label="Good response"
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onThumbsUp}
        size="icon-sm"
        title="Good response"
        type="button"
        variant="ghost"
      >
        <ThumbUpIcon />
      </Button>
      <Button
        aria-label="Bad response"
        className="text-muted-foreground/50 hover:text-foreground"
        onClick={onThumbsDown}
        size="icon-sm"
        title="Bad response"
        type="button"
        variant="ghost"
      >
        <ThumbDownIcon />
      </Button>
    </div>
  );
}
