"use client";

import { useState, useCallback } from "react";
import { useCopyToClipboard } from "usehooks-ts";
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
import { CopyIcon, CheckCircleFillIcon, LockIcon } from "./icons";

export interface ShareChatDialogProps extends React.ComponentProps<typeof Dialog> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  chatId?: string;
  shareUrl?: string;
  onMakePrivate?: () => void;
  title?: string;
  description?: string;
}

export function ShareChatDialog({
  open,
  onOpenChange,
  chatId,
  shareUrl: customShareUrl,
  onMakePrivate,
  title = "Share chat",
  description = "Anyone with this link will be able to view this chat.",
  ...props
}: ShareChatDialogProps) {
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);

  const shareUrl =
    customShareUrl ||
    (typeof window !== "undefined"
      ? chatId
        ? `${window.location.origin}/chat/${chatId}`
        : window.location.href
      : "");

  const handleCopy = useCallback(() => {
    if (!shareUrl) return;
    copyToClipboard(shareUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [shareUrl, copyToClipboard]);

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
            onClick={(e) => e.currentTarget.select()}
            className="text-muted-foreground"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
            aria-label="Copy share link"
          >
            {copied ? (
              <CheckCircleFillIcon className="text-green-500" />
            ) : (
              <CopyIcon />
            )}
          </Button>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          <Button
            variant="secondary"
            onClick={handleMakePrivate}
            className="gap-2"
          >
            <LockIcon size={14} />
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
