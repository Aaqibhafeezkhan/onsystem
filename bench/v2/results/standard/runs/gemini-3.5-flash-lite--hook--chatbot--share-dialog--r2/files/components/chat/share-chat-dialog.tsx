"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { updateChatVisibility } from "@/app/(chat)/actions";
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
import { CopyIcon } from "./icons";
import { CheckIcon } from "lucide-react";

export interface ShareChatDialogProps
  extends React.ComponentProps<typeof Dialog> {
  chatId?: string;
  shareUrl?: string;
  onMakePrivate?: () => void | Promise<void>;
}

export function ShareChatDialog({
  chatId,
  shareUrl: initialShareUrl,
  onMakePrivate,
  ...props
}: ShareChatDialogProps) {
  const [_, copyToClipboard] = useCopyToClipboard();
  const [hasCopied, setHasCopied] = useState(false);

  const shareUrl =
    initialShareUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/chat/${chatId ?? ""}`
      : "");

  const handleCopy = useCallback(async () => {
    if (!shareUrl) {
      toast.error("No share link available!");
      return;
    }

    await copyToClipboard(shareUrl);
    setHasCopied(true);
    toast.success("Copied to clipboard!");

    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [copyToClipboard, shareUrl]);

  const handleMakePrivate = useCallback(async () => {
    if (onMakePrivate) {
      await onMakePrivate();
    } else if (chatId) {
      await updateChatVisibility({
        chatId,
        visibility: "private",
      });
    }

    props.onOpenChange?.(false);
    toast.success("Chat is now private");
  }, [chatId, onMakePrivate, props]);

  return (
    <Dialog {...props}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            Anyone with this link will be able to view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            className="h-9 flex-1 bg-muted/50 text-sm select-all"
            onClick={(e) => e.currentTarget.select()}
            readOnly
            value={shareUrl}
          />
          <Button
            className="size-9 shrink-0"
            data-testid="share-copy-button"
            onClick={handleCopy}
            size="icon"
            title="Copy link"
            variant="outline"
          >
            {hasCopied ? <CheckIcon className="size-4" /> : <CopyIcon />}
            <span className="sr-only">Copy link</span>
          </Button>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          <Button
            data-testid="make-private-button"
            onClick={handleMakePrivate}
            variant="outline"
          >
            Make private
          </Button>
          <Button onClick={() => props.onOpenChange?.(false)} variant="default">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
