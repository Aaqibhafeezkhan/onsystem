import { Add, Notification } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

interface SubscribersEmptyStateProps {
  onAddSubscriber?: () => void;
}

export function SubscribersEmptyState({
  onAddSubscriber,
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer className="py-8">
      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg border">
        <Notification aria-hidden="true" />
      </div>
      <EmptyStateTitle className="mt-2 font-medium">
        No subscribers yet
      </EmptyStateTitle>
      <EmptyStateDescription>
        Visitors who subscribe to this status page will be listed here.
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
