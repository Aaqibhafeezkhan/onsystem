import { Add, Notification } from "@openstatus/icons";
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
    <EmptyStateContainer>
      <Notification
        aria-hidden="true"
        className="mb-2 size-8 text-muted-foreground"
      />
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Add subscribers to keep everyone informed about status updates.
      </EmptyStateDescription>
      <Button className="mt-2" onClick={onAddSubscriber} variant="outline">
        <Add />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
