"use client";

import { useId, useState } from "react";
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
  const linkId = useId();
  const [isCopying, setIsCopying] = useState(false);
  const [isMakingPrivate, setIsMakingPrivate] = useState(false);

  async function handleCopy() {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
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
      toast.success("Chat is now private.");
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
            Anyone with the link can view this chat. Make it private to stop
            sharing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor={linkId}>Share link</Label>
          <div className="flex items-center gap-2">
            <Input
              id={linkId}
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              value={shareUrl}
            />
            <Button
              aria-label="Copy share link"
              disabled={!shareUrl || isCopying || isMakingPrivate}
              onClick={handleCopy}
              size="icon"
              title="Copy share link"
              type="button"
              variant="outline"
            >
              <CopyIcon />
            </Button>
          </div>
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
