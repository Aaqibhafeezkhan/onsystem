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
import { Textarea } from "@openstatus/ui/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useInvalidateIncident } from "@/components/incidents/use-invalidate-incident";
import { useTRPC } from "@/lib/trpc/client";
import { errorMessage } from "@/lib/trpc/error";

/** Dialog for resolving an incident with an optional final timeline update. */
export function ResolveIncidentDialog({
  incidentId,
  open,
  onOpenChange,
  onResolved,
}: {
  incidentId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved?: (note: string) => void;
}) {
  const [message, setMessage] = useState("");
  const trpc = useTRPC();
  const invalidate = useInvalidateIncident(incidentId);
  const resolve = useMutation(
    trpc.incident.setStatus.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  async function submit() {
    if (resolve.isPending) return;
    const note = message.trim();
    const promise = resolve.mutateAsync({
      id: incidentId,
      status: "resolved",
      note: note || undefined,
    });
    toast.promise(promise, {
      loading: "Resolving incident...",
      success: "Incident resolved",
      error: (error) => errorMessage(error, "Failed to resolve incident"),
    });

    try {
      await promise;
      onOpenChange(false);
      onResolved?.(note);
    } catch (error) {
      console.error("Failed to resolve incident:", error);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve incident?</AlertDialogTitle>
          <AlertDialogDescription>
            Add a final update to the incident timeline before resolving it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          aria-label="Final update"
          placeholder="Share a final update..."
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={resolve.isPending}
            onClick={(event) => {
              event.preventDefault();
              submit().catch(console.error);
            }}
          >
            {resolve.isPending ? "Resolving..." : "Resolve incident"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
