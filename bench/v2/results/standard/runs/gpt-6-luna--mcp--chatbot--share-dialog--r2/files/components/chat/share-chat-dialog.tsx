"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { CopyIcon } from "./icons";

export function ShareChatDialog({
  chatId,
  open,
  onOpenChange,
}: {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [shareLink, setShareLink] = useState("");
  const [_, copyToClipboard] = useCopyToClipboard();
  const { setVisibilityType } = useChatVisibility({
    chatId,
    initialVisibilityType: "public",
  });

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const normalizedBasePath = basePath.replace(/\/$/, "");
    setShareLink(`${window.location.origin}${normalizedBasePath}/chat/${chatId}`);
  }, [chatId]);

  const handleCopy = async () => {
    if (!shareLink) return;

    try {
      await copyToClipboard(shareLink);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy the link.");
    }
  };

  const handleMakePrivate = () => {
    setVisibilityType("private");
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            Anyone with this link can view this chat.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Share link"
            className="min-w-0"
            readOnly
            value={shareLink}
          />
          <Button
            aria-label="Copy share link"
            disabled={!shareLink}
            onClick={handleCopy}
            size="icon"
            type="button"
            variant="outline"
          >
            <CopyIcon />
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={handleMakePrivate} type="button" variant="secondary">
            Make private
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
