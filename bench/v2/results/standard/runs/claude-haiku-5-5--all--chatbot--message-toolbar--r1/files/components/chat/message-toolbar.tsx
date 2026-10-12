"use client"

import { CopyIcon, RotateCcwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type MessageToolbarProps = {
  className?: string
  onCopy?: () => void
  onRegenerate?: () => void
  onThumbsUp?: () => void
  onThumbsDown?: () => void
}

export function MessageToolbar({
  className,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
}: MessageToolbarProps) {
  const actions = [
    { label: "Copy", icon: <CopyIcon />, onClick: onCopy },
    { label: "Regenerate", icon: <RotateCcwIcon />, onClick: onRegenerate },
    { label: "Thumbs up", icon: <ThumbsUpIcon />, onClick: onThumbsUp },
    { label: "Thumbs down", icon: <ThumbsDownIcon />, onClick: onThumbsDown },
  ]

  return (
    <TooltipProvider>
      <div
        role="toolbar"
        aria-label="Message actions"
        className={cn("flex items-center gap-0.5", className)}
      >
        {actions.map((action) => (
          <Tooltip key={action.label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={action.label}
                className="text-muted-foreground hover:text-foreground"
                onClick={action.onClick}
              >
                {action.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{action.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
