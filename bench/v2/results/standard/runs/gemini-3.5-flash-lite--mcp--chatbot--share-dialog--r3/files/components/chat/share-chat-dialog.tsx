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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;
  shareUrl?: string;
  chatId?: string;
  onMakePrivate?: () => void;
}

export function ShareChatDialog({
  open,
  onOpenChange,
  isOpen,
  onClose,
  shareUrl,
  chatId,
  onMakePrivate,
}: ShareChatDialogProps) {
  const [_, copyToClipboard] = useCopyToClipboard();

  const resolvedOpen = open ?? isOpen ?? false;
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen);
    if (!newOpen) {
      onClose?.();
    }
  };

  const resolvedShareUrl =
    shareUrl ??
    (typeof window !== "undefined" && chatId
      ? `${window.location.origin}/chat/${chatId}`
      : "");

  const handleCopy = useCallback(async () => {
    if (!resolvedShareUrl) {
      toast.error("No share link available!");
      return;
    }

    await copyToClipboard(resolvedShareUrl);
    toast.success("Copied share link to clipboard!");
  }, [copyToClipboard, resolvedShareUrl]);

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            Anyone with this link will be able to view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <InputGroup>
            <InputGroupInput readOnly value={resolvedShareUrl} />
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

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {onMakePrivate ? (
            <Button
              variant="outline"
              onClick={() => {
                onMakePrivate();
                handleOpenChange(false);
              }}
            >
              Make private
            </Button>
          ) : (
            <div />
          )}
          <Button
            variant="default"
            onClick={() => handleOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
