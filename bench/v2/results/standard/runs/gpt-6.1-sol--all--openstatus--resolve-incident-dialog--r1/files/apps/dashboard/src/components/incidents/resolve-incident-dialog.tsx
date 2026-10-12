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
import { Label } from "@openstatus/ui/components/ui/label";
import { Textarea } from "@openstatus/ui/components/ui/textarea";
import { useEffect, useId, useState } from "react";

export type ResolveIncidentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The caller handles resolving the incident and closing on success. */
  onConfirm: (message: string) => void;
  pending?: boolean;
  defaultMessage?: string;
};

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onConfirm,
  pending = false,
  defaultMessage = "",
}: ResolveIncidentDialogProps) {
  const messageId = useId();
  const [message, setMessage] = useState(defaultMessage);

  useEffect(() => {
    if (open) setMessage(defaultMessage);
  }, [open, defaultMessage]);

  function handleOpenChange(nextOpen: boolean) {
    if (!pending) onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Add a final update describing the resolution before marking this
            incident as resolved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={messageId}>Final update</Label>
          <Textarea
            id={messageId}
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Describe how the incident was resolved..."
            disabled={pending}
            required
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || !message.trim()}
            aria-busy={pending}
            onClick={() => onConfirm(message.trim())}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
