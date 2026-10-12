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
import { useId, useState } from "react";

interface ResolveIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (finalUpdate: string) => void;
}

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  onResolve,
}: ResolveIncidentDialogProps) {
  const [finalUpdate, setFinalUpdate] = useState("");
  const textareaId = useId();

  const handleResolve = () => {
    onResolve(finalUpdate.trim());
    setFinalUpdate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve incident</DialogTitle>
          <DialogDescription>
            Post a final update to let subscribers know the incident is
            resolved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={textareaId}>Final update</Label>
          <Textarea
            id={textareaId}
            value={finalUpdate}
            onChange={(event) => setFinalUpdate(event.target.value)}
            placeholder="Describe how the incident was resolved..."
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleResolve}>Resolve incident</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
