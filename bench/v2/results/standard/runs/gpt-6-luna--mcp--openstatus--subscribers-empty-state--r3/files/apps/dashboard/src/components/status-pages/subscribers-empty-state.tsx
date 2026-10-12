import { Email } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

type SubscribersEmptyStateProps = {
  onAddSubscriber: () => void;
};

export function SubscribersEmptyState({
  onAddSubscriber,
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer>
      <Email aria-hidden="true" className="text-muted-foreground size-6" />
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Add a subscriber to keep them informed about status page updates.
      </EmptyStateDescription>
      <Button className="mt-2" onClick={onAddSubscriber}>
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
