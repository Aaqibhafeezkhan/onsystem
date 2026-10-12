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

/**
 * Collects the final public-facing update when resolving an incident.
 * The update is optional; the parent performs the actual status change.
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
  const textareaId = useId();

  // Start each opening with a blank update so stale text never resurfaces.
  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Add a final update for the timeline. It is posted with the
            resolution.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={textareaId}>Final update</Label>
          <Textarea
            id={textareaId}
            rows={4}
            placeholder="What was the fix, and is the service fully restored?"
            value={message}
            disabled={pending}
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
            onClick={() => onResolve(message.trim())}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
