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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = finalUpdate.trim();
    if (!message || pending) return;

    onResolve(message);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Add a final update to let everyone know how the incident was resolved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="resolve-incident-update">Final update</Label>
            <Textarea
              id="resolve-incident-update"
              rows={4}
              placeholder="Share what resolved the incident..."
              value={finalUpdate}
              onChange={(event) => setFinalUpdate(event.target.value)}
              disabled={pending}
              required
            />
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !finalUpdate.trim()}>
              Resolve incident
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
