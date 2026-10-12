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

export interface ResolveIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (update: string) => void | Promise<void>;
  defaultMessage?: string;
  pending?: boolean;
}

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
  defaultMessage = "",
  pending = false,
}: ResolveIncidentDialogProps) {
  const [update, setUpdate] = useState(defaultMessage);

  useEffect(() => {
    if (open) {
      setUpdate(defaultMessage);
    }
  }, [open, defaultMessage]);

  async function handleResolve(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    await onResolve(update);
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
          <AlertDialogTitle>Resolve incident</AlertDialogTitle>
          <AlertDialogDescription>
            Provide a final update for this incident before resolving it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          rows={4}
          placeholder="Final update / resolution details..."
          value={update}
          onChange={(e) => setUpdate(e.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={handleResolve}
          >
            {pending ? "Resolving..." : "Resolve incident"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
