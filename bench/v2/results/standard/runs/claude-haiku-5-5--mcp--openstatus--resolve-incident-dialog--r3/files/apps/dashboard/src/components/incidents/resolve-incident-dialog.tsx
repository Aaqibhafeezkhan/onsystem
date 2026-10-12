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
import { useId, useState } from "react";

/**
 * Asks for the final public update before an incident is marked as resolved.
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Post a final update describing how the incident was resolved.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={textareaId}>Final update</Label>
          <Textarea
            id={textareaId}
            rows={4}
            value={message}
            placeholder="The issue has been fixed and all services are operating normally."
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!message.trim() || pending}
            onClick={() => onResolve(message.trim())}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
