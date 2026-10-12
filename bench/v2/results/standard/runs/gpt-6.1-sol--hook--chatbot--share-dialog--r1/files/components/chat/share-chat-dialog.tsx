"use client";

import { CopyIcon } from "lucide-react";
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
      toast.error("Unable to copy the link. Please copy it manually.");
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
        <DialogHeader className="pr-8">
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            Anyone with the link can access this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
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
              disabled={!shareUrl || isCopying}
              onClick={handleCopy}
              size="icon"
              title="Copy share link"
              type="button"
              variant="outline"
            >
              <CopyIcon aria-hidden="true" className="size-4" />
            </Button>
          </div>
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
