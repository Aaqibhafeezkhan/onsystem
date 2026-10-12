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
import { useEffect, useState } from "react";

/**
 * Collects the final update written when an incident is resolved.
 * The text is optional; an empty value resolves without a note.
 */
export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (note: string | undefined) => void;
  pending?: boolean;
}) {
  const [message, setMessage] = useState("");

  // Start every opening with a clean textarea.
  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve this incident?</DialogTitle>
          <DialogDescription>
            Write the final update for your team and subscribers. Resolving
            keeps the incident reversible until it is closed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="resolve-incident-message">Final update</Label>
          <Textarea
            id="resolve-incident-message"
            rows={4}
            placeholder="What was the root cause, and what was done to fix it?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() => onResolve(message.trim() || undefined)}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
