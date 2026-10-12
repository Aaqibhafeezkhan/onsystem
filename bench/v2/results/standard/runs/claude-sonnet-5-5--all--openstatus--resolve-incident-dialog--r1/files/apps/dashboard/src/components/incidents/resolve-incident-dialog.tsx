"use client";

import { Button } from "@openstatus/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@openstatus/ui/components/ui/dialog";
import { Label } from "@openstatus/ui/components/ui/label";
import { Textarea } from "@openstatus/ui/components/ui/textarea";
import * as React from "react";

interface ResolveIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (message: string) => void | Promise<void>;
}

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
}: ResolveIncidentDialogProps) {
  const [message, setMessage] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const id = React.useId();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    try {
      await onResolve(message);
      setMessage("");
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Resolve incident</DialogTitle>
            <DialogDescription>
              Post a final update to let subscribers know the incident is
              resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={id}>Final update</Label>
            <Textarea
              id={id}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="The issue has been resolved."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Resolve incident
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
