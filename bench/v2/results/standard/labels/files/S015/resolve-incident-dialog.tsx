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
import { Label } from "@openstatus/ui/components/ui/label";
import { Textarea } from "@openstatus/ui/components/ui/textarea";
import { useEffect, useId, useState } from "react";

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onConfirm,
  pending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
  pending?: boolean;
}) {
  const [message, setMessage] = useState("");
  const messageId = useId();

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve incident</AlertDialogTitle>
          <AlertDialogDescription>
            Add a final update summarizing how the incident was resolved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={messageId}>Final update</Label>
          <Textarea
            id={messageId}
            rows={4}
            placeholder="Describe the resolution…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={pending}
            required
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || !message.trim()}
            aria-busy={pending}
            onClick={(event) => {
              event.preventDefault();
              if (!pending && message.trim()) onConfirm(message.trim());
            }}
          >
            Resolve incident
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
