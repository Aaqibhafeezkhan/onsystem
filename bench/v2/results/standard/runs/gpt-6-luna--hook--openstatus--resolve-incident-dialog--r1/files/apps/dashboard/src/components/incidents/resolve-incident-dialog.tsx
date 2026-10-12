"use client";

import { Button } from "@openstatus/ui/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@openstatus/ui/components/ui/dialog";
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
  onResolved,
}: {
  incidentId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved?: (note: string) => void;
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
    const note = message.trim();
    if (!note || resolve.isPending) return;

    const promise = resolve.mutateAsync({
      id: incidentId,
      status: "resolved",
      note,
    });
    toast.promise(promise, {
      loading: "Resolving incident...",
      success: "Incident resolved",
      error: (error) => errorMessage(error, "Failed to resolve incident"),
    });

    await promise;
    setMessage("");
    onOpenChange(false);
    onResolved?.(note);
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
        <div className="grid gap-2">
          <Label htmlFor="resolve-incident-update">Final update</Label>
          <Textarea
            id="resolve-incident-update"
            rows={4}
            placeholder="Summarize the resolution and any follow-up."
            value={message}
            disabled={resolve.isPending}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={resolve.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={!message.trim() || resolve.isPending}
            onClick={() => submit().catch(() => {})}
          >
            Resolve incident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
