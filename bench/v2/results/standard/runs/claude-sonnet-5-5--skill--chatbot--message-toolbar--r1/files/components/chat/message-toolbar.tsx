"use client";

import {
  CopyIcon,
  RefreshCwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type MessageToolbarProps = {
  className?: string;
  disabled?: boolean;
  vote?: "up" | "down" | null;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
};

function ToolbarButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  pressed,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          aria-pressed={pressed}
          className="text-muted-foreground"
          disabled={disabled}
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
  );
}

export function MessageToolbar({
  className,
  disabled,
  vote,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
}: MessageToolbarProps) {
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        <ToolbarButton
          disabled={disabled}
          icon={CopyIcon}
          label="Copy"
          onClick={onCopy}
        />
        <ToolbarButton
          disabled={disabled}
          icon={RefreshCwIcon}
          label="Regenerate"
          onClick={onRegenerate}
        />
        <ToolbarButton
          disabled={disabled}
          icon={ThumbsUpIcon}
          label="Good response"
          onClick={onThumbsUp}
          pressed={vote === "up"}
        />
        <ToolbarButton
          disabled={disabled}
          icon={ThumbsDownIcon}
          label="Bad response"
          onClick={onThumbsDown}
          pressed={vote === "down"}
        />
      </div>
    </TooltipProvider>
  );
}
