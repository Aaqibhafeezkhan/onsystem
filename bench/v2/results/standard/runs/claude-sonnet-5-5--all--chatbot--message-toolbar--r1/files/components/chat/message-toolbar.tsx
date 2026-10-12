"use client";

import {
  CopyIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const actions = [
    { label: "Copy", icon: CopyIcon, onClick: onCopy },
    { label: "Regenerate", icon: RefreshCcwIcon, onClick: onRegenerate },
    { label: "Good response", icon: ThumbsUpIcon, onClick: onThumbsUp },
    { label: "Bad response", icon: ThumbsDownIcon, onClick: onThumbsDown },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 text-muted-foreground">
        {actions.map(({ label, icon: Icon, onClick }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                aria-label={label}
                onClick={onClick}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
