"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { type FocusEvent, useCallback, useEffect, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";

const COPIED_RESET_DELAY_MS = 2000;

export type ShareChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  onMakePrivate?: () => void | Promise<void>;
  className?: string;
};

export function ShareChatDialog({
  open,
  onOpenChange,
  shareUrl,
  onMakePrivate,
  className,
}: ShareChatDialogProps) {
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
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
      resetTimer.current = setTimeout(() => {
        setCopied(false);
      }, COPIED_RESET_DELAY_MS);
    } catch {
      toast.error("Failed to copy link to clipboard");
    }
  }, [shareUrl]);

  const handleInputFocus = useCallback((event: FocusEvent<HTMLInputElement>) => {
    event.currentTarget.select();
  }, []);

  const CopyStateIcon = copied ? CheckIcon : CopyIcon;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={cn("gap-4", className)}>
        <DialogHeader>
          <DialogTitle>Share this chat</DialogTitle>
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
            <CopyStateIcon />
          </Button>
        </div>

        {onMakePrivate ? (
          <DialogFooter>
            <Button
              data-testid="share-chat-make-private"
              onClick={() => {
                void onMakePrivate();
              }}
              type="button"
              variant="secondary"
            >
              Make private
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
