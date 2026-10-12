import { Add, Inbox } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export function SubscribersEmptyState({
  onAddSubscriber,
}: {
  onAddSubscriber?: () => void;
}) {
  return (
    <EmptyStateContainer className="py-8">
      <Inbox className="text-muted-foreground size-6" aria-hidden="true" />
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Subscribers get notified when you post updates on this status page.
      </EmptyStateDescription>
      <Button size="sm" className="mt-2" onClick={onAddSubscriber}>
        <Add />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
