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

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
  defaultUpdate = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (finalUpdate: string) => void | Promise<void>;
  defaultUpdate?: string;
}) {
  const [finalUpdate, setFinalUpdate] = useState(defaultUpdate);
  const [pending, setPending] = useState(false);
  const updateId = useId();

  useEffect(() => {
    if (open) setFinalUpdate(defaultUpdate);
  }, [open, defaultUpdate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !finalUpdate.trim()) return;

    setPending(true);
    try {
      await onResolve(finalUpdate);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to resolve incident:", error);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident?</DialogTitle>
          <DialogDescription>
            Add a final update to share how the incident was resolved.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor={updateId}>Final update</Label>
            <Textarea
              id={updateId}
              rows={5}
              placeholder="Describe how the incident was resolved..."
              value={finalUpdate}
              onChange={(event) => setFinalUpdate(event.target.value)}
              disabled={pending}
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
            <Button type="submit" disabled={pending || !finalUpdate.trim()}>
              Resolve incident
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
