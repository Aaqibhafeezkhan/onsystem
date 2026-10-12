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
  defaultUpdate = "",
  pending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (finalUpdate: string) => void;
  defaultUpdate?: string;
  pending?: boolean;
}) {
  const [finalUpdate, setFinalUpdate] = useState(defaultUpdate);

  useEffect(() => {
    if (open) setFinalUpdate(defaultUpdate);
  }, [open, defaultUpdate]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve this incident?</AlertDialogTitle>
          <AlertDialogDescription>
            Add a final update to let everyone know how the incident was
            resolved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="resolve-incident-update">Final update</Label>
          <Textarea
            id="resolve-incident-update"
            rows={4}
            value={finalUpdate}
            onChange={(event) => setFinalUpdate(event.target.value)}
            placeholder="Share the resolution and any follow-up details..."
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              onResolve(finalUpdate);
              onOpenChange(false);
            }}
          >
            Resolve incident
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
