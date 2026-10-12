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
  onConfirm: (message: string) => void;
  defaultMessage?: string;
  pending?: boolean;
};

/** The caller resolves the incident and closes the dialog after success. */
export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onConfirm,
  defaultMessage = "",
  pending = false,
}: ResolveIncidentDialogProps) {
  const [message, setMessage] = useState(defaultMessage);
  const messageId = useId();

  useEffect(() => {
    if (open) setMessage(defaultMessage);
  }, [open, defaultMessage]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Add a final update to summarize the resolution of this incident.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!pending && message.trim()) onConfirm(message.trim());
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor={messageId}>Final update</Label>
            <Textarea
              id={messageId}
              name="message"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe how the incident was resolved…"
              disabled={pending}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !message.trim()}
              aria-busy={pending}
            >
              Resolve incident
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
