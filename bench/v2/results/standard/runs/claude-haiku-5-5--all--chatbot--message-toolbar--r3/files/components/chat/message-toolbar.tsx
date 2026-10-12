"use client";

import { CopyIcon, RefreshCwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type MessageToolbarProps = ComponentProps<"div"> & {
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
};

const actions = [
  { key: "copy", label: "Copy", icon: CopyIcon },
  { key: "regenerate", label: "Regenerate", icon: RefreshCwIcon },
  { key: "thumbs-up", label: "Good response", icon: ThumbsUpIcon },
  { key: "thumbs-down", label: "Bad response", icon: ThumbsDownIcon },
] as const;

export function MessageToolbar({
  className,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  ...props
}: MessageToolbarProps) {
  const handlers: Record<(typeof actions)[number]["key"], (() => void) | undefined> = {
    copy: onCopy,
    regenerate: onRegenerate,
    "thumbs-up": onThumbsUp,
    "thumbs-down": onThumbsDown,
  };

  return (
    <div
      className={cn("flex items-center gap-1 text-muted-foreground", className)}
      {...props}
    >
      <TooltipProvider>
        {actions.map(({ key, label, icon: Icon }) => (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={label}
                onClick={handlers[key]}
              >
                <Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
