"use client";

import { CheckIcon } from "lucide-react";
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
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CopyIcon, LockIcon } from "./icons";

export interface ShareChatDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  url: string;
  onMakePrivate?: () => void;
  onCopy?: () => void;
  children?: React.ReactNode;
}

export function ShareChatDialog({
  open,
  onOpenChange,
  url,
  onMakePrivate,
  onCopy,
  children,
}: ShareChatDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Copied to clipboard!");
      onCopy?.();
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [url, onCopy]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share chat</DialogTitle>
          <DialogDescription>
            Anyone with this link will be able to view this chat.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <InputGroup>
            <InputGroupInput readOnly value={url} />
            <InputGroupButton
              aria-label="Copy share link"
              onClick={handleCopy}
              size="icon-sm"
              variant="ghost"
            >
              {copied ? <CheckIcon className="size-4" /> : <CopyIcon />}
              <span className="sr-only">Copy link</span>
            </InputGroupButton>
          </InputGroup>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={onMakePrivate}
            className="w-full sm:w-auto"
          >
            <LockIcon size={14} />
            Make private
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => onOpenChange?.(false)}
            className="w-full sm:w-auto"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
