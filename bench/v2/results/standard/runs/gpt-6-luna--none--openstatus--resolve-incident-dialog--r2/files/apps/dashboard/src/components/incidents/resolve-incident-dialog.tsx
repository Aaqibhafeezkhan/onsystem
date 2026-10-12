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

/** A controlled dialog for resolving an incident with an optional final update. */
export function ResolveIncidentDialog({
  incident,
  open,
  onOpenChange,
}: {
  incident: { id: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const trpc = useTRPC();
  const invalidate = useInvalidateIncident(incident.id);
  const resolve = useMutation(
    trpc.incident.setStatus.mutationOptions({ onSuccess: invalidate }),
  );

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  async function submit() {
    const promise = resolve.mutateAsync({
      id: incident.id,
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
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to resolve incident:", error);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve this incident?</AlertDialogTitle>
          <AlertDialogDescription>
            Add a final update for your team before resolving the incident.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="resolve-incident-update">Final update</Label>
          <Textarea
            id="resolve-incident-update"
            rows={4}
            placeholder="Share a final update..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
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
