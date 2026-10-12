"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ShareChatDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  chatId?: string;
  shareUrl?: string;
  url?: string;
  link?: string;
  onMakePrivate?: () => void;
  onCopy?: () => void;
}

export function ShareChatDialog({
  open,
  isOpen,
  onOpenChange,
  onClose,
  chatId,
  shareUrl,
  url,
  link,
  onMakePrivate,
  onCopy,
}: ShareChatDialogProps) {
  const [isCopied, setIsCopied] = useState(false);

  const isDialogOpen = open ?? isOpen ?? false;

  const handleOpenChange = useCallback(
    (value: boolean) => {
      onOpenChange?.(value);
      if (!value) {
        onClose?.();
      }
    },
    [onOpenChange, onClose]
  );

  const shareLink =
    shareUrl ||
    url ||
    link ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/chat/${chatId ?? ""}`
      : "");

  const handleCopy = useCallback(async () => {
    if (!shareLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      toast.success("Copied to clipboard!");
      onCopy?.();
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [shareLink, onCopy]);

  const handleMakePrivate = useCallback(() => {
    onMakePrivate?.();
    handleOpenChange(false);
  }, [onMakePrivate, handleOpenChange]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
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
            value={shareLink}
            className="flex-1 select-all"
            onClick={(e) => {
              e.currentTarget.select();
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy link"
            className="shrink-0"
          >
            {isCopied ? (
              <CheckIcon className="size-4" />
            ) : (
              <CopyIcon className="size-4" />
            )}
            <span className="sr-only">Copy link</span>
          </Button>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleMakePrivate}
            className="w-full sm:w-auto"
          >
            Make private
          </Button>
          <Button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
