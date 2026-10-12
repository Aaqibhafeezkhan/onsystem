"use client";

import { CheckIcon } from "lucide-react";
import { useCallback, useState } from "react";
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
  shareUrl?: string;
  chatId?: string;
  onCopy?: () => void;
  onMakePrivate?: () => void;
}

export function ShareChatDialog({
  open,
  onOpenChange,
  shareUrl,
  chatId,
  onCopy,
  onMakePrivate,
}: ShareChatDialogProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard();

  const urlToShare =
    shareUrl ||
    (typeof window !== "undefined" && chatId
      ? `${window.location.origin}/chat/${chatId}`
      : "");

  const handleCopy = useCallback(async () => {
    if (!urlToShare) {
      toast.error("No share link available!");
      return;
    }

    await copyToClipboard(urlToShare);
    setIsCopied(true);
    toast.success("Copied to clipboard!");
    onCopy?.();

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }, [urlToShare, copyToClipboard, onCopy]);

  const handleMakePrivate = useCallback(() => {
    onMakePrivate?.();
    onOpenChange(false);
  }, [onMakePrivate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            Anyone with this link will be able to view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <InputGroup className="bg-input/30">
            <InputGroupInput
              readOnly
              value={urlToShare}
              onClick={(e) => e.currentTarget.select()}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                variant="ghost"
                onClick={handleCopy}
                title="Copy link"
              >
                {isCopied ? <CheckIcon className="size-4" /> : <CopyIcon />}
                <span className="sr-only">Copy link</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handleMakePrivate}
            type="button"
          >
            Make private
          </Button>
          <Button
            variant="default"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
