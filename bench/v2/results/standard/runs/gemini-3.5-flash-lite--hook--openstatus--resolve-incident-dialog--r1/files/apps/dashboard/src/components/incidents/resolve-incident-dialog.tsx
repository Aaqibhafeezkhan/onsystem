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
import { useEffect, useState } from "react";

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
  defaultMessage = "",
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (message: string) => void | Promise<void>;
  defaultMessage?: string;
  pending?: boolean;
}) {
  const [message, setMessage] = useState(defaultMessage);
  const [internalPending, setInternalPending] = useState(false);
  const isPending = pending ?? internalPending;

  useEffect(() => {
    if (open) {
      setMessage(defaultMessage);
    }
  }, [open, defaultMessage]);

  async function handleResolve(e: React.MouseEvent) {
    e.preventDefault();
    try {
      setInternalPending(true);
      await onResolve(message);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setInternalPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document.body.style.pointerEvents = "";
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve incident?</AlertDialogTitle>
          <AlertDialogDescription>
            Add a final update to record the resolution on the timeline.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          rows={4}
          placeholder="What was the resolution or fix?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleResolve}>
            {isPending ? "Resolving..." : "Resolve incident"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
