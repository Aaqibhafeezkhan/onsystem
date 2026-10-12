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
 * Resolving is reversible, so this dialog does not need a destructive style.
 */
export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
  pending,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Write the final update shared with your team and subscribers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="resolve-incident-message">Final update</Label>
          <Textarea
            id="resolve-incident-message"
            rows={4}
            placeholder="The issue has been fixed and all services are operating normally."
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
            onClick={() => onResolve(message.trim())}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
