"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@openstatus/ui/components/ui/dialog";
import { Button } from "@openstatus/ui/components/ui/button";
import { Label } from "@openstatus/ui/components/ui/label";
import { Textarea } from "@openstatus/ui/components/ui/textarea";
import { useEffect, useState } from "react";

/**
 * Asks for the final update before an incident is marked as resolved.
 * Nothing is resolved until the user confirms with the final update text.
 */
export function ResolveIncidentDialog({
  incidentName,
  open,
  onOpenChange,
  onResolve,
  pending = false,
}: {
  incidentName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (message: string) => void | Promise<void>;
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
            {incidentName
              ? `Write the final update for ${incidentName}.`
              : "Write the final update for this incident."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!message.trim() || pending) return;
            void onResolve(message.trim());
          }}
        >
          <Label htmlFor="resolve-incident-message">Final update</Label>
          <Textarea
            id="resolve-incident-message"
            rows={4}
            value={message}
            placeholder="Describe how the incident was resolved"
            onChange={(e) => setMessage(e.target.value)}
          />
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!message.trim() || pending}>
              Resolve incident
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
