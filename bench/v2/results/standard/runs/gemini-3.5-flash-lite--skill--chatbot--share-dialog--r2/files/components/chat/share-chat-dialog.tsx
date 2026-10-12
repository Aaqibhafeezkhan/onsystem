"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CopyIcon, CheckCircleFillIcon, LockIcon } from "./icons";

export interface ShareChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl?: string;
  shareLink?: string;
  url?: string;
  onMakePrivate?: () => void;
  onCopy?: () => void;
  title?: string;
  description?: string;
}

export function ShareChatDialog({
  open,
  onOpenChange,
  shareUrl,
  shareLink,
  url,
  onMakePrivate,
  onCopy,
  title = "Share chat",
  description = "Anyone with this link will be able to view this chat.",
}: ShareChatDialogProps) {
  const [copied, setCopied] = useState(false);

  const resolvedUrl =
    shareUrl ||
    shareLink ||
    url ||
    (typeof window !== "undefined" ? window.location.href : "");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      toast.success("Copied to clipboard!");
      onCopy?.();
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [resolvedUrl, onCopy]);

  const handleMakePrivate = useCallback(() => {
    onMakePrivate?.();
    onOpenChange(false);
  }, [onMakePrivate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <InputGroup>
            <InputGroupInput
              readOnly
              value={resolvedUrl}
              onFocus={(e) => e.target.select()}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                onClick={handleCopy}
                aria-label="Copy link"
              >
                {copied ? (
                  <CheckCircleFillIcon size={16} />
                ) : (
                  <CopyIcon size={16} />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMakePrivate}
            className="gap-1.5"
          >
            <LockIcon size={14} />
            <span>Make private</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
