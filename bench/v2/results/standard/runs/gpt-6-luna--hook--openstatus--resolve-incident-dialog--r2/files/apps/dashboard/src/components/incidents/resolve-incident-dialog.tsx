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

import { useTRPC } from "@/lib/trpc/client";
import { errorMessage } from "@/lib/trpc/error";

import { useInvalidateIncident } from "./use-invalidate-incident";

/** Resolve an incident, optionally including a final update in its timeline. */
export function ResolveIncidentDialog({
  incidentId,
  open,
  onOpenChange,
}: {
  incidentId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const trpc = useTRPC();
  const invalidate = useInvalidateIncident(incidentId);
  const [message, setMessage] = useState("");
  const resolve = useMutation(
    trpc.incident.setStatus.mutationOptions({ onSuccess: invalidate }),
  );

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  async function submit() {
    const promise = resolve.mutateAsync({
      id: incidentId,
      status: "resolved",
      note: message.trim() || undefined,
    });
    toast.promise(promise, {
      loading: "Resolving incident...",
      success: "Incident resolved",
      error: (error) => errorMessage(error, "Failed to resolve"),
    });
    try {
      await promise;
      setMessage("");
      onOpenChange(false);
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
            Add a final update for the incident timeline, then resolve it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          aria-label="Final update"
          placeholder="What was the resolution?"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resolve.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={resolve.isPending}
            onClick={(event) => {
              event.preventDefault();
              submit().catch(console.error);
            }}
          >
            Resolve incident
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
