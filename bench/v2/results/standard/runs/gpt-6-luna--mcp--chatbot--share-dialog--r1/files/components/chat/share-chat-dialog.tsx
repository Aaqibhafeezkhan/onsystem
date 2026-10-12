"use client";

import { useCopyToClipboard } from "usehooks-ts";
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

  const handleCopy = async () => {
    try {
      await copyToClipboard(shareUrl);
      toast.success("Share link copied to clipboard.");
    } catch {
      toast.error("Could not copy the share link.");
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
          <Input aria-label="Share link" readOnly value={shareUrl} />
          <Button
            aria-label="Copy share link"
            onClick={handleCopy}
            size="icon"
            variant="outline"
          >
            <CopyIcon />
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
