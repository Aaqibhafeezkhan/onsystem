"use client";

import { CopyIcon } from "lucide-react";
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
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.error("Unable to copy the share link.");
    }
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
          <Input aria-label="Share link" readOnly value={shareUrl} />
          <Button
            aria-label="Copy share link"
            className="shrink-0"
            onClick={handleCopy}
            size="icon"
            variant="outline"
          >
            <CopyIcon />
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onMakePrivate} variant="secondary">
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
