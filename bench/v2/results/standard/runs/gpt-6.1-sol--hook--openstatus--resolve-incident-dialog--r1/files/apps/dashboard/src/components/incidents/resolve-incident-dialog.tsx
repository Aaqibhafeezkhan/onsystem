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
  defaultMessage = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
  pending?: boolean;
  defaultMessage?: string;
}) {
  const [message, setMessage] = useState(defaultMessage);
  const messageId = useId();

  useEffect(() => {
    if (open) setMessage(defaultMessage);
  }, [open, defaultMessage]);

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
            Add a final update to let your team know how the incident was
            resolved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={messageId}>Final update</Label>
          <Textarea
            id={messageId}
            rows={4}
            placeholder="What was fixed, and how was recovery confirmed?"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={pending}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || !message.trim()}
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
