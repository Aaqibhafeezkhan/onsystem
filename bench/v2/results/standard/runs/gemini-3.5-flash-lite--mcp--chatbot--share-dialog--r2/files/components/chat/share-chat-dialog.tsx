"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";
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
  const [isCopied, setIsCopied] = useState(false);

  const fullShareUrl =
    shareUrl ||
    (typeof window !== "undefined" && chatId
      ? `${window.location.origin}/chat/${chatId}`
      : "");

  const handleCopy = useCallback(async () => {
    if (!fullShareUrl) return;
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setIsCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [fullShareUrl]);

  const handleMakePrivate = useCallback(() => {
    onMakePrivate?.();
    onOpenChange(false);
    toast.success("Chat is now private");
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

        <div className="flex items-center gap-2 py-2">
          <Input
            readOnly
            value={fullShareUrl}
            className="flex-1 bg-muted/50 text-muted-foreground select-all"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button
            size="icon"
            variant="outline"
            className="shrink-0"
            onClick={handleCopy}
          >
            {isCopied ? <CheckIcon className="size-4" /> : <CopyIcon />}
            <span className="sr-only">Copy link</span>
          </Button>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={handleMakePrivate}
          >
            <LockIcon size={14} />
            <span>Make private</span>
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
