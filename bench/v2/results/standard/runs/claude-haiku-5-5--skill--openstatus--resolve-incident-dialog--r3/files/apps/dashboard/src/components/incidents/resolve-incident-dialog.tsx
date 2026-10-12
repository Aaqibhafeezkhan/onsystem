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
 * Collects the final update and resolves the incident.
 * The message is required so the timeline always ends with a closing note.
 */
export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
  pending?: boolean;
}) {
  const [message, setMessage] = useState("");
  const textareaId = useId();

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve this incident?</DialogTitle>
          <DialogDescription>
            Write the final update for your subscribers. The incident will be
            marked as resolved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={textareaId}>Final update</Label>
          <Textarea
            id={textareaId}
            rows={4}
            placeholder="The issue has been fixed and all services are operating normally."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
            type="button"
            disabled={!message.trim() || pending}
            onClick={() => onConfirm(message.trim())}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
