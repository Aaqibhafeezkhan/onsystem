"use client"

import { CopyIcon, RefreshCwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type MessageToolbarProps = {
  onCopy?: () => void
  onRegenerate?: () => void
  onThumbsUp?: () => void
  onThumbsDown?: () => void
  className?: string
}

function MessageToolbar({
  onCopy,
  onRegenerate,
  onThumbsUp,
  onThumbsDown,
  className,
}: MessageToolbarProps) {
  return (
    <TooltipProvider>
      <ButtonGroup className={cn("text-muted-foreground", className)}>
        <ToolbarButton label="Copy" onClick={onCopy}>
          <CopyIcon />
        </ToolbarButton>
        <ToolbarButton label="Regenerate" onClick={onRegenerate}>
          <RefreshCwIcon />
        </ToolbarButton>
        <ToolbarButton label="Good response" onClick={onThumbsUp}>
          <ThumbsUpIcon />
        </ToolbarButton>
        <ToolbarButton label="Bad response" onClick={onThumbsDown}>
          <ThumbsDownIcon />
        </ToolbarButton>
      </ButtonGroup>
    </TooltipProvider>
  )
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export { MessageToolbar }
