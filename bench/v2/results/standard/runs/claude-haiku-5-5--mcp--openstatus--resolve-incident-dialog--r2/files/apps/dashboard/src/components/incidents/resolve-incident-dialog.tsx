"use client";

import { Button } from "@openstatus/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
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
 * Resolves an incident with a final update written by the user.
 * Resolving is reversible, so no extra confirmation is required beyond this dialog.
 */
export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
  pending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (finalUpdate: string) => void;
  pending?: boolean;
}) {
  const [finalUpdate, setFinalUpdate] = useState("");

  useEffect(() => {
    if (open) setFinalUpdate("");
  }, [open]);

  const trimmed = finalUpdate.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Write the final update for this incident. It will be recorded on the
            incident timeline.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="resolve-incident-final-update">Final update</Label>
          <Textarea
            id="resolve-incident-final-update"
            rows={4}
            placeholder="Describe how the incident was resolved"
            value={finalUpdate}
            onChange={(e) => setFinalUpdate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
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
