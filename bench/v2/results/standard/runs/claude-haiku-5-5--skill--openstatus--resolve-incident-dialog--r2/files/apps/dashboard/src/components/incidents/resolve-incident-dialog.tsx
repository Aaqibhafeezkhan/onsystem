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
import { useEffect, useId, useState } from "react";

/**
 * Asks for the final update before an incident is marked as resolved.
 * The parent performs the mutation in `onResolve`, receiving the trimmed text.
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
  const textareaId = useId();

  useEffect(() => {
    if (open) setFinalUpdate("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Add a final update for your subscribers explaining how the incident
            was resolved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={textareaId}>Final update</Label>
          <Textarea
            id={textareaId}
            rows={4}
            placeholder="The issue has been fixed and all services are operating normally."
            value={finalUpdate}
            onChange={(e) => setFinalUpdate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={pending}
            onClick={() => onResolve(finalUpdate.trim())}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
