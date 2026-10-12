import { Button } from "@/components/ui/button";
import { CopyIcon, RedoIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

type MessageToolbarProps = {
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
    <div aria-label="Message actions" className="flex items-center gap-1">
      <Button
        aria-label="Copy message"
        className="text-muted-foreground hover:text-foreground"
        onClick={onCopy}
        size="icon-sm"
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
        type="button"
        variant="ghost"
      >
        <RedoIcon />
      </Button>
      <Button
        aria-label="Thumbs up"
        className="text-muted-foreground hover:text-foreground"
        onClick={onThumbsUp}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <ThumbUpIcon />
      </Button>
      <Button
        aria-label="Thumbs down"
        className="text-muted-foreground hover:text-foreground"
        onClick={onThumbsDown}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <ThumbDownIcon />
      </Button>
    </div>
  );
}
