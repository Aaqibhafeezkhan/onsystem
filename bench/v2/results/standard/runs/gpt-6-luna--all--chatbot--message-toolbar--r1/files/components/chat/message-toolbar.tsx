import {
  CopyIcon,
  RotateCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type MessageToolbarProps = {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
};

export function MessageToolbar({
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
}: MessageToolbarProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        aria-label="Copy message"
        className="text-muted-foreground hover:text-foreground"
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
        className="text-muted-foreground hover:text-foreground"
        onClick={onRegenerate}
        size="icon-sm"
        title="Regenerate response"
        type="button"
        variant="ghost"
      >
        <RotateCcwIcon />
      </Button>
      <Button
        aria-label="Thumbs up"
        className="text-muted-foreground hover:text-foreground"
        onClick={onThumbsUp}
        size="icon-sm"
        title="Thumbs up"
        type="button"
        variant="ghost"
      >
        <ThumbsUpIcon />
      </Button>
      <Button
        aria-label="Thumbs down"
        className="text-muted-foreground hover:text-foreground"
        onClick={onThumbsDown}
        size="icon-sm"
        title="Thumbs down"
        type="button"
        variant="ghost"
      >
        <ThumbsDownIcon />
      </Button>
    </div>
  );
}
