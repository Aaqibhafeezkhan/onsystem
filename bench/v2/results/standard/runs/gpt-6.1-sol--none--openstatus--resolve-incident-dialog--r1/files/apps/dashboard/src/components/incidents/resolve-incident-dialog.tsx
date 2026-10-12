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

/** The caller owns the resolution request and closes the dialog on success. */
export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onConfirm,
  pending = false,
  defaultMessage = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
  pending?: boolean;
  defaultMessage?: string;
}) {
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
            Mark this incident as resolved. Add a final update for your team to
            summarize the resolution.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!pending) onConfirm(message.trim());
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor={messageId}>Final update (optional)</Label>
            <Textarea
              id={messageId}
              rows={4}
              placeholder="What was fixed, and how was recovery confirmed?"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={pending}
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
            <Button type="submit" disabled={pending} aria-busy={pending}>
              Resolve incident
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
