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
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useTRPC } from "@/lib/trpc/client";
import { errorMessage } from "@/lib/trpc/error";

import { useInvalidateIncident } from "./use-invalidate-incident";

/** Resolve an incident with a final timeline update. */
export function ResolveIncidentDialog({
  incident,
  open,
  onOpenChange,
}: {
  incident: { id: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [finalUpdate, setFinalUpdate] = useState("");
  const trpc = useTRPC();
  const invalidate = useInvalidateIncident(incident.id);
  const resolve = useMutation(
    trpc.incident.setStatus.mutationOptions({
      onSuccess: invalidate,
      onError: (error) => toast.error(errorMessage(error, "Failed to resolve")),
    }),
  );

  useEffect(() => {
    if (open) setFinalUpdate("");
  }, [open]);

  async function handleResolve() {
    const note = finalUpdate.trim();
    if (!note || resolve.isPending) return;

    const promise = resolve.mutateAsync({
      id: incident.id,
      status: "resolved",
      note,
    });
    toast.promise(promise, {
      loading: "Resolving incident...",
      success: "Incident resolved",
      error: (error) => errorMessage(error, "Failed to resolve"),
    });

    try {
      await promise;
      onOpenChange(false);
    } catch {
      // Keep the dialog open so the update can be retried.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve incident?</AlertDialogTitle>
          <AlertDialogDescription>
            Add a final update before resolving this incident.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="resolve-incident-final-update">Final update</Label>
          <Textarea
            id="resolve-incident-final-update"
            rows={4}
            placeholder="Summarize the resolution and any follow-up steps."
            value={finalUpdate}
            onChange={(event) => setFinalUpdate(event.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resolve.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!finalUpdate.trim() || resolve.isPending}
            onClick={(event) => {
              event.preventDefault();
              handleResolve().catch(console.error);
            }}
          >
            {resolve.isPending ? "Resolving..." : "Resolve incident"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
