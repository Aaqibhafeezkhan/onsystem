"use client";

import { Button } from "@openstatus/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@openstatus/ui/components/ui/dialog";
import { Textarea } from "@openstatus/ui/components/ui/textarea";
import { useEffect, useState } from "react";

export interface ResolveIncidentDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultMessage?: string;
  onResolve?: (message: string) => void | Promise<void>;
  pending?: boolean;
}

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  defaultMessage = "",
  onResolve,
  pending,
}: ResolveIncidentDialogProps) {
  const [message, setMessage] = useState(defaultMessage);

  useEffect(() => {
    if (open) {
      setMessage(defaultMessage);
    }
  }, [open, defaultMessage]);

  async function handleResolve() {
    if (onResolve) {
      await onResolve(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Provide a final update on how the incident was resolved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Textarea
            rows={4}
            placeholder="Write final update..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            disabled={pending || !message.trim()}
            onClick={(e) => {
              e.preventDefault();
              handleResolve().catch(console.error);
            }}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
