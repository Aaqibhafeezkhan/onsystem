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
  onResolve?: (message: string) => Promise<void> | void;
  onConfirm?: (message: string) => Promise<void> | void;
  defaultMessage?: string;
  pending?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * A dialog to resolve an incident, featuring a textarea for the final update,
 * a Cancel button, and a 'Resolve incident' action button.
 */
export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
  onConfirm,
  defaultMessage = "",
  pending = false,
  title = "Resolve incident?",
  description = "Add a final update or notes before resolving this incident.",
}: ResolveIncidentDialogProps) {
  const [message, setMessage] = useState(defaultMessage);
  const [isInternalPending, setIsInternalPending] = useState(false);

  useEffect(() => {
    if (open) {
      setMessage(defaultMessage);
    }
  }, [open, defaultMessage]);

  const isLoading = pending || isInternalPending;

  async function handleResolve(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    try {
      setIsInternalPending(true);
      if (onResolve) {
        await onResolve(message);
      } else if (onConfirm) {
        await onConfirm(message);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to resolve incident:", error);
    } finally {
      setIsInternalPending(false);
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
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a final update or resolution notes..."
          disabled={isLoading}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isLoading} onClick={handleResolve}>
            {isLoading ? "Resolving..." : "Resolve incident"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
