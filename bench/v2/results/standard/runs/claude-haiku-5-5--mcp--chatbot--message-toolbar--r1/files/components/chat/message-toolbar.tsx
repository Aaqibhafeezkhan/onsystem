"use client"

import * as React from "react"
import {
  CopyIcon,
  RotateCcwIcon,
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

type Feedback = "up" | "down" | null

interface MessageToolbarProps extends React.ComponentProps<"div"> {
  onCopy?: () => void
  onRegenerate?: () => void
  onFeedback?: (feedback: Exclude<Feedback, null>) => void
}

function MessageToolbar({
  className,
  onCopy,
  onRegenerate,
  onFeedback,
  ...props
}: MessageToolbarProps) {
  const [feedback, setFeedback] = React.useState<Feedback>(null)

  const handleFeedback = (value: Exclude<Feedback, null>) => {
    const next = feedback === value ? null : value
    setFeedback(next)
    if (next) onFeedback?.(next)
  }

  return (
    <TooltipProvider>
      <div
        role="toolbar"
        aria-label="Message actions"
        data-slot="message-toolbar"
        className={cn("flex items-center gap-1 text-muted-foreground", className)}
        {...props}
      >
        <ToolbarButton label="Copy" onClick={onCopy}>
          <CopyIcon />
        </ToolbarButton>
        <ToolbarButton label="Regenerate" onClick={onRegenerate}>
          <RotateCcwIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Good response"
          pressed={feedback === "up"}
          onClick={() => handleFeedback("up")}
        >
          <ThumbsUpIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Bad response"
          pressed={feedback === "down"}
          onClick={() => handleFeedback("down")}
        >
          <ThumbsDownIcon />
        </ToolbarButton>
      </div>
    </TooltipProvider>
  )
}

interface ToolbarButtonProps {
  label: string
  onClick?: () => void
  pressed?: boolean
  children: React.ReactNode
}

function ToolbarButton({ label, onClick, pressed, children }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={pressed === undefined ? undefined : pressed}
          data-state={pressed ? "on" : "off"}
          onClick={onClick}
          className={cn(pressed && "text-foreground")}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export { MessageToolbar }
export type { MessageToolbarProps }
