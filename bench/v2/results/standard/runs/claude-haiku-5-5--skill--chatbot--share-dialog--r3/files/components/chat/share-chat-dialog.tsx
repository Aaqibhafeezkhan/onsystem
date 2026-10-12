"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";
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
  const [, copyToClipboard] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timeout = window.setTimeout(() => setIsCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  useEffect(() => {
    if (!open) {
      setIsCopied(false);
    }
  }, [open]);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(shareUrl);
    setIsCopied(ok);
  }, [copyToClipboard, shareUrl]);

  const handleMakePrivate = useCallback(() => {
    onMakePrivate();
    onOpenChange(false);
  }, [onMakePrivate, onOpenChange]);

  const CopyStateIcon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this chat</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            aria-label="Share link"
            className="flex-1"
            readOnly
            value={shareUrl}
          />
          <Button
            aria-label={isCopied ? "Link copied" : "Copy link"}
            onClick={handleCopy}
            size="icon"
            type="button"
            variant="outline"
          >
            <CopyStateIcon />
          </Button>
        </div>

        <DialogFooter>
          <Button
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
