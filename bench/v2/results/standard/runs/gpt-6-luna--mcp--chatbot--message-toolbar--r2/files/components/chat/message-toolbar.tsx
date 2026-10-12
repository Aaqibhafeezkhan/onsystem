"use client";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

type MessageToolbarProps = {
  content?: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
};

export function MessageToolbar({
  content,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
}: MessageToolbarProps) {
  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
      return;
    }

    if (!content) {
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Unable to copy response.");
    }
  };

  const actions = [
    {
      label: "Copy",
      icon: <CopyIcon />,
      onClick: handleCopy,
      disabled: !onCopy && !content,
    },
    {
      label: "Regenerate",
      icon: <RotateCcw aria-hidden="true" />,
      onClick: onRegenerate,
    },
    {
      label: "Good response",
      icon: <ThumbUpIcon />,
      onClick: onThumbsUp,
    },
    {
      label: "Bad response",
      icon: <ThumbDownIcon />,
      onClick: onThumbsDown,
    },
  ];

  return (
    <TooltipProvider>
      <div aria-label="Assistant message actions" className="flex items-center gap-1">
        {actions.map(({ label, icon, onClick, disabled }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                aria-label={label}
                className="text-muted-foreground/70 hover:text-foreground"
                disabled={disabled}
                onClick={onClick}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                {icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
