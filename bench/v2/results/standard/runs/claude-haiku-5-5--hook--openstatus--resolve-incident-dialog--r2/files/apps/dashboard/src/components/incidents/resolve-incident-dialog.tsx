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

/**
 * Collects the final update before an incident is resolved.
 * The update is only submitted when the user clicks "Resolve incident".
 */
export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
  pending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (message: string) => void;
  pending?: boolean;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  const trimmed = message.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          // Opened from menus; body stays unclickable without this.
          event.preventDefault();
          document.body.style.pointerEvents = "";
        }}
      >
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Add a final update for subscribers explaining how the incident was
            resolved.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          placeholder="The issue has been fixed and all services are operating normally."
          value={message}
          disabled={pending}
          onChange={(e) => setMessage(e.target.value)}
          aria-label="Final update"
        />
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={!trimmed || pending}
            onClick={() => onResolve(trimmed)}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
