"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import {
  type FocusEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const COPIED_FEEDBACK_MS = 2000;

export function ShareChatDialog({
  open,
  onOpenChange,
  shareUrl,
  onMakePrivate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  onMakePrivate?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  // Reset the copied state whenever the dialog is closed or the link changes.
  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeout = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
    } catch {
      // Fall back to selecting the link so the user can copy it manually.
      inputRef.current?.focus();
      inputRef.current?.select();
      toast.error("Could not copy the link. It has been selected for you.");
    }
  }, [shareUrl]);

  const handleInputFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      event.currentTarget.select();
    },
    []
  );

  const handleMakePrivate = useCallback(() => {
    onMakePrivate?.();
    onOpenChange(false);
  }, [onMakePrivate, onOpenChange]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent data-testid="share-chat-dialog">
        <DialogHeader>
          <DialogTitle>Share link to chat</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            aria-label="Share link"
            data-testid="share-chat-link"
            onFocus={handleInputFocus}
            readOnly
            ref={inputRef}
            value={shareUrl}
          />
          <Button
            aria-label={copied ? "Link copied" : "Copy link"}
            data-testid="share-chat-copy"
            onClick={handleCopy}
            size="icon"
            title={copied ? "Copied" : "Copy link"}
            type="button"
            variant="outline"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>

        <DialogFooter>
          <Button
            data-testid="share-chat-make-private"
            onClick={handleMakePrivate}
            type="button"
            variant="secondary"
          >
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
