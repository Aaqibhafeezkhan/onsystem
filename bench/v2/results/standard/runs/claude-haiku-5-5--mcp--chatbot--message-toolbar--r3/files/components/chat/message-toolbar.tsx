"use client"

import * as React from "react"
import { CopyIcon, RefreshCwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type MessageToolbarProps = React.ComponentProps<"div"> & {
  onCopy?: () => void
  onRegenerate?: () => void
  onThumbsUp?: () => void
  onThumbsDown?: () => void
}

function MessageToolbar({
  className,
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  ...props
}: MessageToolbarProps) {
  const actions = [
    { label: "Copy", icon: CopyIcon, onClick: onCopy },
    { label: "Regenerate", icon: RefreshCwIcon, onClick: onRegenerate },
    { label: "Good response", icon: ThumbsUpIcon, onClick: onThumbsUp },
    { label: "Bad response", icon: ThumbsDownIcon, onClick: onThumbsDown },
  ]

  return (
    <TooltipProvider>
      <div
        role="toolbar"
        aria-label="Message actions"
        data-slot="message-toolbar"
        className={cn("flex items-center gap-1", className)}
        {...props}
      >
        {actions.map(({ label, icon: Icon, onClick }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={label}
                onClick={onClick}
                className="text-muted-foreground"
              >
                <Icon aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

export { MessageToolbar }
