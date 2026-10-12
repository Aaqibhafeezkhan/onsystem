"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  useEffect(() => {
    setCopied(false);
  }, [open, shareUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
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
            Anyone with this link can view this chat.
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
            aria-label={copied ? "Link copied" : "Copy share link"}
            disabled={!shareUrl}
            onClick={handleCopy}
            size="icon"
            variant="outline"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={handleMakePrivate} variant="secondary">
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
