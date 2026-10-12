import { Button } from "@openstatus/ui/components/ui/button";
import { UserPlus, Users } from "lucide-react";

interface SubscribersEmptyStateProps {
  onAddSubscriber?: () => void;
}

/** Shown on a status page that has no subscribers yet. */
export function SubscribersEmptyState({
  onAddSubscriber,
}: SubscribersEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border bg-background">
        <Users className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="font-medium text-foreground">No subscribers yet</h3>
        <p className="max-w-sm text-muted-foreground text-sm">
          Subscribers receive an email when you publish incidents or
          maintenances on this status page.
        </p>
      </div>
      <Button type="button" onClick={onAddSubscriber}>
        <UserPlus />
        Add subscriber
      </Button>
    </div>
  );
}
