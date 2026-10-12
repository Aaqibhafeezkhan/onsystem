"use client";

import { useState } from "react";
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
import { CopyIcon } from "./icons";

export type ShareChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  onMakePrivate: () => void | Promise<void>;
};

export function ShareChatDialog({
  open,
  onOpenChange,
  shareUrl,
  onMakePrivate,
}: ShareChatDialogProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isMakingPrivate, setIsMakingPrivate] = useState(false);

  async function handleCopy() {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.error("Unable to copy the link. Select and copy it manually.");
    } finally {
      setIsCopying(false);
    }
  }

  async function handleMakePrivate() {
    setIsMakingPrivate(true);
    try {
      await onMakePrivate();
      onOpenChange(false);
    } catch {
      toast.error("Unable to make this chat private. Please try again.");
    } finally {
      setIsMakingPrivate(false);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            Anyone with this link can view this chat. Make it private to stop
            sharing.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Share link"
            className="min-w-0 flex-1"
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            value={shareUrl}
          />
          <Button
            aria-label="Copy share link"
            className="shrink-0"
            disabled={!shareUrl || isCopying || isMakingPrivate}
            onClick={handleCopy}
            size="icon"
            type="button"
            variant="outline"
          >
            <span aria-hidden="true">
              <CopyIcon />
            </span>
          </Button>
        </div>
        <DialogFooter>
          <Button
            disabled={isMakingPrivate}
            onClick={handleMakePrivate}
            type="button"
            variant="secondary"
          >
            {isMakingPrivate ? "Making private…" : "Make private"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
