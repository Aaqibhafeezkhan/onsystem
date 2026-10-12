"use client";

import { useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import { CopyIcon, LockIcon } from "./icons";

export type ShareChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId?: string;
  shareUrl?: string;
  onCopy?: () => void;
  onMakePrivate?: () => void;
};

export function ShareChatDialog({
  open,
  onOpenChange,
  chatId,
  shareUrl,
  onCopy,
  onMakePrivate,
}: ShareChatDialogProps) {
  const url =
    shareUrl ??
    (chatId && typeof window !== "undefined"
      ? `${window.location.origin}/chat/${chatId}`
      : "");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Copied to clipboard!");
      onCopy?.();
    } catch {
      toast.error("Failed to copy link");
    }
  }, [url, onCopy]);

  const handleMakePrivate = useCallback(() => {
    onMakePrivate?.();
    onOpenChange(false);
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

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="share-link">Share link</Label>
            <div className="flex items-center gap-2">
              <Input
                id="share-link"
                readOnly
                value={url}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                aria-label="Copy link"
              >
                <CopyIcon />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          <Button
            variant="secondary"
            onClick={handleMakePrivate}
            className="gap-2"
          >
            <LockIcon size={14} />
            <span>Make private</span>
          </Button>
          <Button
            variant="default"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
