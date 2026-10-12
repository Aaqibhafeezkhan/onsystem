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
 * Collects the final update written when an incident is resolved.
 * The parent performs the mutation via `onConfirm` with the trimmed message.
 */
export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onConfirm,
  pending = false,
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

  const trimmed = message.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Write the final update for this incident. It will be recorded in the
            timeline as the resolution.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={textareaId}>Final update</Label>
          <Textarea
            id={textareaId}
            rows={4}
            placeholder="Describe how the incident was resolved…"
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
            disabled={!trimmed || pending}
            onClick={() => onConfirm(trimmed)}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
