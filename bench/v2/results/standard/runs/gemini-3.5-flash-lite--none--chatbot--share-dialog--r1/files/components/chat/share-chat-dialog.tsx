"use client";

import { useState, useCallback } from "react";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "@/components/chat/icons";

export interface ShareChatDialogProps extends React.ComponentProps<typeof Dialog> {
  chatId?: string;
  url?: string;
  onMakePrivate?: () => void;
  title?: string;
  description?: string;
}

export function ShareChatDialog({
  chatId,
  url,
  onMakePrivate,
  title = "Share link",
  description = "Anyone with this link will be able to view this chat.",
  open,
  onOpenChange,
  ...props
}: ShareChatDialogProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    url ||
    (typeof window !== "undefined" && chatId
      ? `${window.location.origin}/chat/${chatId}`
      : chatId
      ? `/chat/${chatId}`
      : "");

  const handleCopy = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [shareUrl]);

  const handleMakePrivate = useCallback(() => {
    onMakePrivate?.();
    onOpenChange?.(false);
  }, [onMakePrivate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={shareUrl}
            className="flex-1 bg-input/30"
            onFocus={(e) => e.target.select()}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleCopy}
            aria-label="Copy share link"
          >
            {copied ? <CheckIcon className="size-4" /> : <CopyIcon />}
          </Button>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handleMakePrivate}
          >
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
