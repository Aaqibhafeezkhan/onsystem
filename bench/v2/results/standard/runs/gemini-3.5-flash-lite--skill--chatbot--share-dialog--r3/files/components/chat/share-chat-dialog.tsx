"use client";

import { useCallback } from "react";
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
import { CopyIcon, LockIcon } from "./icons";

export interface ShareChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId?: string;
  shareUrl?: string;
  onMakePrivate?: () => void;
}

export function ShareChatDialog({
  open,
  onOpenChange,
  chatId,
  shareUrl,
  onMakePrivate,
}: ShareChatDialogProps) {
  const [_, copyToClipboard] = useCopyToClipboard();

  const url =
    shareUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/chat/${chatId}`
      : "");

  const handleCopy = useCallback(async () => {
    if (!url) {
      toast.error("No link to copy!");
      return;
    }
    await copyToClipboard(url);
    toast.success("Copied to clipboard!");
  }, [copyToClipboard, url]);

  const handleMakePrivate = useCallback(() => {
    onMakePrivate?.();
    onOpenChange(false);
  }, [onMakePrivate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            Anyone with this link will be able to view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={url}
            className="flex-1 select-all"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy share link"
          >
            <CopyIcon />
          </Button>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <Button
            variant="outline"
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
