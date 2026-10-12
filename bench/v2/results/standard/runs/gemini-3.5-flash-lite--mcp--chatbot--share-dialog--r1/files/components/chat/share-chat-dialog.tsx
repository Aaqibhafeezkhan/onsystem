"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CopyIcon } from "./icons";

export interface ShareChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url?: string;
  shareUrl?: string;
  onMakePrivate?: () => void;
  title?: string;
  description?: string;
}

export function ShareChatDialog({
  open,
  onOpenChange,
  url,
  shareUrl,
  onMakePrivate,
  title = "Share chat",
  description = "Anyone with this link will be able to view this chat.",
}: ShareChatDialogProps) {
  const [_, copyToClipboard] = useCopyToClipboard();

  const linkValue =
    url ||
    shareUrl ||
    (typeof window !== "undefined" ? window.location.href : "");

  const handleCopy = useCallback(async () => {
    if (!linkValue) {
      toast.error("No link to copy!");
      return;
    }
    await copyToClipboard(linkValue);
    toast.success("Copied to clipboard!");
  }, [linkValue, copyToClipboard]);

  const handleMakePrivate = useCallback(() => {
    if (onMakePrivate) {
      onMakePrivate();
    }
    onOpenChange(false);
  }, [onMakePrivate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <InputGroup>
            <InputGroupInput readOnly value={linkValue} />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                variant="ghost"
                onClick={handleCopy}
                aria-label="Copy link"
              >
                <CopyIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <DialogFooter showCloseButton>
          <Button variant="outline" onClick={handleMakePrivate} className="sm:mr-auto">
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
