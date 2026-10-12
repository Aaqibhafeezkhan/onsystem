"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

const COPIED_RESET_MS = 2000;

export function ShareChatDialog({
  open,
  onOpenChange,
  shareUrl,
  onMakePrivate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  onMakePrivate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  const handleCopy = useCallback(async () => {
    try {
      if (inputRef.current) {
        inputRef.current.select();
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
      resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); the link stays selectable.
      setCopied(false);
    }
  }, [shareUrl]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-4">
        <DialogHeader>
          <DialogTitle>Share this chat</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            aria-label="Share link"
            className="font-mono text-xs md:text-xs"
            data-testid="share-chat-link"
            onFocus={(event) => event.currentTarget.select()}
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
            onClick={onMakePrivate}
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
