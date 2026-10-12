"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@openstatus/ui/components/ui/dialog";
import { Button } from "@openstatus/ui/components/ui/button";
import { Label } from "@openstatus/ui/components/ui/label";
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
  const [update, setUpdate] = useState("");
  const trpc = useTRPC();
  const invalidate = useInvalidateIncident(incidentId);
  const resolve = useMutation(
    trpc.incident.setStatus.mutationOptions({
      onSuccess: invalidate,
      onError: (error) => toast.error(errorMessage(error, "Failed to resolve")),
    }),
  );

  useEffect(() => {
    if (open) setUpdate("");
  }, [open]);

  async function handleResolve() {
    const note = update.trim();
    const promise = resolve.mutateAsync({
      id: incidentId,
      status: "resolved",
      note: note || undefined,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident?</DialogTitle>
          <DialogDescription>
            Add a final update to the incident timeline before resolving it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="resolve-incident-update">Final update</Label>
          <Textarea
            id="resolve-incident-update"
            rows={4}
            placeholder="Share what resolved the incident..."
            value={update}
            onChange={(event) => setUpdate(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={resolve.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={resolve.isPending}
            onClick={() => handleResolve().catch(console.error)}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
