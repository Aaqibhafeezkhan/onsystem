"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@openstatus/ui/components/ui/alert-dialog";
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
  onResolve: (finalUpdate: string) => void | Promise<void>;
  pending?: boolean;
}) {
  const [finalUpdate, setFinalUpdate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const busy = pending || isSubmitting;

  useEffect(() => {
    if (open) setFinalUpdate("");
  }, [open]);

  async function handleResolve() {
    if (busy || !finalUpdate.trim()) return;

    setIsSubmitting(true);
    try {
      await onResolve(finalUpdate.trim());
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to resolve incident:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve incident?</AlertDialogTitle>
          <AlertDialogDescription>
            Add a final update to share what resolved the incident.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="resolve-incident-update">Final update</Label>
          <Textarea
            id="resolve-incident-update"
            rows={4}
            placeholder="Describe the resolution..."
            value={finalUpdate}
            onChange={(event) => setFinalUpdate(event.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy || !finalUpdate.trim()}
            onClick={(event) => {
              event.preventDefault();
              void handleResolve();
            }}
          >
            {busy ? "Resolving..." : "Resolve incident"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
