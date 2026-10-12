"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access may be unavailable in some browser contexts.
    }
  };

  const handleMakePrivate = () => {
    onMakePrivate();
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            aria-label="Share link"
            className="min-w-0"
            readOnly
            value={shareUrl}
          />
          <Button
            aria-label={copied ? "Copied link" : "Copy link"}
            className="shrink-0"
            onClick={handleCopy}
            size="icon"
            title={copied ? "Copied" : "Copy link"}
            type="button"
            variant="outline"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button onClick={handleMakePrivate} type="button" variant="secondary">
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
