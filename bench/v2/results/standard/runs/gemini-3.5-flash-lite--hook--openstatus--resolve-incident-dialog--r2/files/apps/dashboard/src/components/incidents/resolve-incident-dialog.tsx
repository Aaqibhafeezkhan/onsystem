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
  pending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve?: (message: string) => void | Promise<void>;
  defaultMessage?: string;
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
    } else {
      onOpenChange(false);
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
          <AlertDialogTitle>Resolve this incident?</AlertDialogTitle>
          <AlertDialogDescription>
            Provide a final update or summary for resolving this incident.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          rows={4}
          placeholder="Final update or resolution notes..."
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
            {pending ? "Resolving..." : "Resolve incident"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
