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
  incident,
  defaultMessage = "",
  onResolve,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident?: { id: number; title: string };
  defaultMessage?: string;
  onResolve?: (message: string) => void | Promise<void>;
  pending?: boolean;
}) {
  const [message, setMessage] = useState(defaultMessage);

  useEffect(() => {
    if (open) {
      setMessage(defaultMessage);
    }
  }, [open, defaultMessage]);

  async function handleResolve() {
    if (onResolve) {
      await onResolve(message);
    }
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {incident?.title ? `Resolve ${incident.title}?` : "Resolve incident"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Provide a final update on how the incident was resolved before closing it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          rows={4}
          placeholder="What was done to resolve this incident?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              handleResolve().catch(console.error);
            }}
          >
            Resolve incident
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
