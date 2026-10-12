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
  onResolve: (finalUpdate: string) => void;
  pending?: boolean;
}) {
  const [finalUpdate, setFinalUpdate] = useState("");

  useEffect(() => {
    if (open) setFinalUpdate("");
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve this incident?</AlertDialogTitle>
          <AlertDialogDescription>
            Add a final update to summarize the resolution.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="resolve-incident-final-update">Final update</Label>
          <Textarea
            id="resolve-incident-final-update"
            rows={4}
            placeholder="Describe how the incident was resolved..."
            value={finalUpdate}
            onChange={(event) => setFinalUpdate(event.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || !finalUpdate.trim()}
            onClick={(event) => {
              event.preventDefault();
              onResolve(finalUpdate.trim());
            }}
          >
            Resolve incident
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
