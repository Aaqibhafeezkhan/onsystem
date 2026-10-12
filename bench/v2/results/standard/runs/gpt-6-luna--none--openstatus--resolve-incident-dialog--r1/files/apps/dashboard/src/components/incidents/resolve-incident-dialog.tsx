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
import { Textarea } from "@openstatus/ui/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useTRPC } from "@/lib/trpc/client";
import { errorMessage } from "@/lib/trpc/error";

import { useInvalidateIncident } from "./use-invalidate-incident";

export function ResolveIncidentDialog({
  incidentId,
  open,
  onOpenChange,
}: {
  incidentId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [finalUpdate, setFinalUpdate] = useState("");
  const trpc = useTRPC();
  const invalidate = useInvalidateIncident(incidentId);
  const resolve = useMutation(
    trpc.incident.setStatus.mutationOptions({
      onSuccess: invalidate,
      onError: (error) => {
        toast.error(errorMessage(error, "Failed to resolve incident"));
      },
    }),
  );

  useEffect(() => {
    if (open) setFinalUpdate("");
  }, [open]);

  async function submit() {
    const promise = resolve.mutateAsync({
      id: incidentId,
      status: "resolved",
      note: finalUpdate.trim() || undefined,
    });
    toast.promise(promise, {
      loading: "Resolving incident...",
      success: "Incident resolved",
      error: (error) => errorMessage(error, "Failed to resolve incident"),
    });
    await promise;
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Add a final update to the incident timeline before resolving it.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          aria-label="Final update"
          placeholder="Share the resolution and any relevant details..."
          rows={4}
          value={finalUpdate}
          onChange={(event) => setFinalUpdate(event.target.value)}
        />
        <DialogFooter>
          <Button
            variant="outline"
            disabled={resolve.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={resolve.isPending}
            onClick={() => submit().catch(console.error)}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
