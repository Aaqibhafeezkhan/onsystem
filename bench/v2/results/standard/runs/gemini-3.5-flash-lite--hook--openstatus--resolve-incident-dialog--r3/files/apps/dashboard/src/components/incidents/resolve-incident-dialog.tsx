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
  defaultMessage = "",
  onConfirm,
  onResolve,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMessage?: string;
  onConfirm?: (message: string) => void | Promise<void>;
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
    const handler = onConfirm ?? onResolve;
    if (handler) {
      await handler(message);
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
            Provide a final update for this incident before resolving it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          rows={4}
          placeholder="Final update..."
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
