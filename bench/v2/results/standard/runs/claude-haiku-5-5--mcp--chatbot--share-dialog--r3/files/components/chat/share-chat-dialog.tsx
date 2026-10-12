"use client"

import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

export interface ShareChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Public share link for the chat. */
  shareUrl: string
  /** Called when the user chooses to make the chat private again. */
  onMakePrivate: () => void
}

const COPIED_FEEDBACK_MS = 2000

export function ShareChatDialog({
  open,
  onOpenChange,
  shareUrl,
  onMakePrivate,
}: ShareChatDialogProps) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    return () => window.clearTimeout(timeout)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const handleMakePrivate = () => {
    onMakePrivate()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this chat</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this chat.
          </DialogDescription>
        </DialogHeader>

        <InputGroup>
          <InputGroupInput
            readOnly
            value={shareUrl}
            aria-label="Share link"
            onFocus={(event) => event.currentTarget.select()}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              variant="ghost"
              aria-label={copied ? "Link copied" : "Copy link"}
              onClick={handleCopy}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <DialogFooter>
          <Button variant="secondary" onClick={handleMakePrivate}>
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
