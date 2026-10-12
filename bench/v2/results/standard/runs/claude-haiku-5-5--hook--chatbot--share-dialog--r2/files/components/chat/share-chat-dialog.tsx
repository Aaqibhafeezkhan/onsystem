"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
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

export function ShareChatDialog({
  open,
  onOpenChange,
  shareUrl,
  onMakePrivate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  onMakePrivate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [shareUrl]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent data-testid="share-chat-dialog">
        <DialogHeader>
          <DialogTitle>Share this chat</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            aria-label="Share link"
            data-testid="share-chat-link"
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            value={shareUrl}
          />
          <Button
            aria-label={copied ? "Link copied" : "Copy link"}
            data-testid="share-chat-copy"
            onClick={handleCopy}
            size="icon"
            type="button"
            variant="outline"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>

        <DialogFooter>
          <Button
            data-testid="share-chat-make-private"
            onClick={onMakePrivate}
            type="button"
            variant="secondary"
          >
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
