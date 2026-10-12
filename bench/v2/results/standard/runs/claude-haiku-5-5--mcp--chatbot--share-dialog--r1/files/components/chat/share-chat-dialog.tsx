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
import { Label } from "@/components/ui/label"

export interface ShareChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Public share link for the chat. */
  shareUrl: string
  /** Called when the user chooses to make the chat private again. */
  onMakePrivate: () => void
  /** Disables the "Make private" action while it is being processed. */
  isMakingPrivate?: boolean
}

const COPIED_FEEDBACK_MS = 2000

export function ShareChatDialog({
  open,
  onOpenChange,
  shareUrl,
  onMakePrivate,
  isMakingPrivate = false,
}: ShareChatDialogProps) {
  const [copied, setCopied] = React.useState(false)
  const inputId = React.useId()

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            Anyone with this link can view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>Share link</Label>
          <InputGroup>
            <InputGroupInput
              id={inputId}
              value={shareUrl}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={copied ? "Link copied" : "Copy link"}
                title={copied ? "Link copied" : "Copy link"}
                onClick={handleCopy}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onMakePrivate}
            disabled={isMakingPrivate}
          >
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
