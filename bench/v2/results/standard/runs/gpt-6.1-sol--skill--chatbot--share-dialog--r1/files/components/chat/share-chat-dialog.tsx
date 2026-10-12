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
  shareLink: string;
  onMakePrivate: () => void | Promise<void>;
};

export function ShareChatDialog({
  open,
  onOpenChange,
  shareLink,
  onMakePrivate,
}: ShareChatDialogProps) {
  const [isMakingPrivate, setIsMakingPrivate] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.error("Unable to copy the link. Select and copy it manually.");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            readOnly
            value={shareLink}
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button
            aria-label="Copy share link"
            disabled={!shareLink || isMakingPrivate}
            onClick={handleCopy}
            size="icon"
            type="button"
            variant="outline"
          >
            <CopyIcon />
          </Button>
        </div>

        <DialogFooter>
          <Button
            aria-busy={isMakingPrivate}
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
