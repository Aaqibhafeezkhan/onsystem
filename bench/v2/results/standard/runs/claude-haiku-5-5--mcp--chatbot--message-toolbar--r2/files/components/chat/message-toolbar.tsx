"use client"

import * as React from "react"
import {
  CopyIcon,
  RefreshCwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface MessageToolbarProps extends React.ComponentProps<"div"> {
  onCopy?: () => void
  onRegenerate?: () => void
  onThumbsUp?: () => void
  onThumbsDown?: () => void
}

function MessageToolbar({
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  className,
  ...props
}: MessageToolbarProps) {
  const actions = [
    { label: "Copy", icon: CopyIcon, onClick: onCopy },
    { label: "Regenerate", icon: RefreshCwIcon, onClick: onRegenerate },
    { label: "Good response", icon: ThumbsUpIcon, onClick: onThumbsUp },
    { label: "Bad response", icon: ThumbsDownIcon, onClick: onThumbsDown },
  ]

  return (
    <div
      role="toolbar"
      aria-label="Message actions"
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      <TooltipProvider>
        {actions.map(({ label, icon: Icon, onClick }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={label}
                onClick={onClick}
              >
                <Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  )
}

export { MessageToolbar }
