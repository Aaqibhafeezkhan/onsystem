import { Add, Team } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

interface SubscribersEmptyStateProps {
  /** Called when the "Add subscriber" button is clicked. */
  onAddSubscriber?: () => void;
}

export function SubscribersEmptyState({
  onAddSubscriber,
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer className="py-8">
      <div className="bg-muted text-muted-foreground mb-2 flex size-10 items-center justify-center rounded-lg">
        <Team className="size-5" />
      </div>
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription className="max-w-sm">
        Nobody has subscribed to this status page. Add subscribers so they
        receive updates about incidents and maintenances.
      </EmptyStateDescription>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={onAddSubscriber}
      >
        <Add /> Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
