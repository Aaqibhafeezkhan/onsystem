"use client";

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
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { CheckCircleFillIcon, CopyIcon, LockIcon } from "./icons";

export interface ShareChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  shareUrl?: string;
  onMakePrivate?: () => void;
}

export function ShareChatDialog({
  open,
  onOpenChange,
  chatId,
  shareUrl: propShareUrl,
  onMakePrivate,
}: ShareChatDialogProps) {
  const [copied, setCopied] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();

  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId,
    initialVisibilityType: "public",
  });

  const shareUrl =
    propShareUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/chat/${chatId}`
      : `/chat/${chatId}`);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) {
      toast.error("No share link available!");
      return;
    }

    await copyToClipboard(shareUrl);
    setCopied(true);
    toast.success("Copied share link to clipboard!");

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [copyToClipboard, shareUrl]);

  const handleMakePrivate = useCallback(() => {
    setVisibilityType("private");
    if (onMakePrivate) {
      onMakePrivate();
    }
    toast.success("Chat is now private");
    onOpenChange(false);
  }, [onMakePrivate, setVisibilityType, onOpenChange]);

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
          <InputGroup>
            <InputGroupInput readOnly value={shareUrl} />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                onClick={handleCopy}
                size="icon-sm"
                variant="ghost"
                title="Copy link"
                data-testid="share-copy-button"
              >
                {copied ? <CheckCircleFillIcon /> : <CopyIcon />}
                <span className="sr-only">Copy link</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
            onClick={handleMakePrivate}
            data-testid="make-private-button"
          >
            <LockIcon size={14} />
            Make private
          </Button>

          <Button
            variant="default"
            className="rounded-full px-4"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
