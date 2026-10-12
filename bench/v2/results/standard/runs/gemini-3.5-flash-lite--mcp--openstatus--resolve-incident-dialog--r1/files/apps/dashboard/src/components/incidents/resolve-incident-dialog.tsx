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
  onResolve: (message: string) => void | Promise<void>;
  pending?: boolean;
  defaultMessage?: string;
  title?: string;
  description?: string;
}

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
  pending = false,
  defaultMessage = "",
  title = "Resolve this incident?",
  description = "Provide a final update on how the incident was resolved.",
}: ResolveIncidentDialogProps) {
  const [message, setMessage] = useState(defaultMessage);

  useEffect(() => {
    if (open) {
      setMessage(defaultMessage);
    }
  }, [open, defaultMessage]);

  async function handleResolve(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    await onResolve(message);
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
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          rows={4}
          placeholder="Add a final update..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={handleResolve}>
            Resolve incident
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
