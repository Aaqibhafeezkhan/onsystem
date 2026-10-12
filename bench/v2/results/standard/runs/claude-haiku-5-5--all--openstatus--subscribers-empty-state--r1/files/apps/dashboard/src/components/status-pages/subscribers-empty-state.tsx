import { Add, Inbox } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

type SubscribersEmptyStateProps = {
  onAddSubscriber?: () => void;
};

export function SubscribersEmptyState({
  onAddSubscriber,
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer className="py-8">
      <div className="bg-muted text-muted-foreground mb-2 flex size-10 items-center justify-center rounded-full">
        <Inbox aria-hidden="true" />
      </div>
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page yet. Add an email or
        webhook subscriber to start sending updates.
      </EmptyStateDescription>
      <Button
        type="button"
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
