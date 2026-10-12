"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyIcon, CheckCircleFillIcon, LockIcon } from "./icons";
import { toast } from "sonner";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { VisibilityType } from "./visibility-selector";

export interface ShareChatDialogProps extends React.ComponentProps<typeof Dialog> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  chatId?: string;
  initialVisibilityType?: VisibilityType;
  shareUrl?: string;
  url?: string;
  link?: string;
  onMakePrivate?: () => void;
  onCopy?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}

export function ShareChatDialog({
  open,
  onOpenChange,
  chatId,
  initialVisibilityType = "public",
  shareUrl,
  url,
  link,
  onMakePrivate,
  onCopy,
  title = "Share chat",
  description = "Anyone with this link will be able to view this chat.",
  children,
  ...props
}: ShareChatDialogProps) {
  const [copied, setCopied] = useState(false);

  const visibilityHook = chatId
    ? useChatVisibility({ chatId, initialVisibilityType })
    : null;

  const targetUrl =
    shareUrl ||
    url ||
    link ||
    (typeof window !== "undefined"
      ? chatId
        ? `${window.location.origin}/chat/${chatId}`
        : window.location.href
      : chatId
      ? `/chat/${chatId}`
      : "");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      toast.success("Copied to clipboard!");
      onCopy?.();
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [targetUrl, onCopy]);

  const handleMakePrivate = useCallback(() => {
    if (visibilityHook) {
      visibilityHook.setVisibilityType("private");
      toast.success("Chat is now private");
    }
    onMakePrivate?.();
    onOpenChange?.(false);
  }, [visibilityHook, onMakePrivate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={targetUrl}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy share link"
          >
            {copied ? <CheckCircleFillIcon /> : <CopyIcon />}
            <span className="sr-only">Copy share link</span>
          </Button>
        </div>

        <DialogFooter className="flex flex-row justify-between items-center sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMakePrivate}
            className="gap-1.5"
          >
            <LockIcon size={14} />
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
