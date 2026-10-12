"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
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
import { CheckCircleFillIcon, CopyIcon, LockIcon } from "./icons";

export interface ShareChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  onMakePrivate?: () => void;
}

export function ShareChatDialog({
  open,
  onOpenChange,
  shareUrl,
  onMakePrivate,
}: ShareChatDialogProps) {
  const [_, copyToClipboard] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    await copyToClipboard(shareUrl);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }, [copyToClipboard, shareUrl]);

  const handleMakePrivate = useCallback(() => {
    onMakePrivate?.();
    onOpenChange(false);
    toast.success("Chat is now private");
  }, [onMakePrivate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            Anyone with this link will be able to view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 pt-2">
          <Input
            readOnly
            value={shareUrl}
            className="h-9 flex-1 rounded-lg border-border/50 bg-muted/50 text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy link"
            className="h-9 w-9 shrink-0"
          >
            {isCopied ? <CheckCircleFillIcon /> : <CopyIcon />}
          </Button>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMakePrivate}
            className="gap-1.5"
          >
            <LockIcon size={14} />
            Make private
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
