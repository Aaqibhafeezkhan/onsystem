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
import { useEffect, useState, type FormEvent } from "react";

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
  pending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (finalUpdate: string) => void | Promise<void>;
  pending?: boolean;
}) {
  const [finalUpdate, setFinalUpdate] = useState("");

  useEffect(() => {
    if (open) setFinalUpdate("");
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!finalUpdate.trim() || pending) return;
    void onResolve(finalUpdate.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Resolve incident</DialogTitle>
            <DialogDescription>
              Add a final update to let everyone know how the incident was
              resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="incident-final-update">Final update</Label>
            <Textarea
              id="incident-final-update"
              name="finalUpdate"
              placeholder="Share what was resolved and any relevant details…"
              rows={4}
              required
              value={finalUpdate}
              onChange={(event) => setFinalUpdate(event.target.value)}
              disabled={pending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!finalUpdate.trim() || pending}>
              {pending ? "Resolving…" : "Resolve incident"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
