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

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (finalUpdate: string) => void;
  pending?: boolean;
}) {
  const [finalUpdate, setFinalUpdate] = useState("");
  const textareaId = useId();
  const canResolve = finalUpdate.trim().length > 0 && !pending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Add a final update for your subscribers before marking this
            incident as resolved.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (canResolve) {
              onResolve(finalUpdate.trim());
            }
          }}
        >
          <Label htmlFor={textareaId}>Final update</Label>
          <Textarea
            id={textareaId}
            name="finalUpdate"
            placeholder="Describe how the incident was resolved…"
            value={finalUpdate}
            onChange={(event) => setFinalUpdate(event.target.value)}
            disabled={pending}
            rows={5}
          />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canResolve}>
              Resolve incident
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
