import type { ComponentProps } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export type MessageToolbarProps = ComponentProps<"div"> & {
  onCopy: () => void;
  onRegenerate: () => void;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
};

export function MessageToolbar({
  className,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  ...props
}: MessageToolbarProps) {
  const buttonClassName = "text-muted-foreground hover:text-foreground";

  return (
    <div
      className={cn("mt-2 flex items-center gap-1", className)}
      {...props}
    >
      <Button
        aria-label="Copy message"
        className={buttonClassName}
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
        className={buttonClassName}
        onClick={onRegenerate}
        size="icon-sm"
        title="Regenerate response"
        type="button"
        variant="ghost"
      >
        <RotateCcw aria-hidden="true" />
      </Button>
      <Button
        aria-label="Thumbs up"
        className={buttonClassName}
        onClick={onThumbsUp}
        size="icon-sm"
        title="Thumbs up"
        type="button"
        variant="ghost"
      >
        <ThumbUpIcon />
      </Button>
      <Button
        aria-label="Thumbs down"
        className={buttonClassName}
        onClick={onThumbsDown}
        size="icon-sm"
        title="Thumbs down"
        type="button"
        variant="ghost"
      >
        <ThumbDownIcon />
      </Button>
    </div>
  );
}
