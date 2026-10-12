import { Add, Team } from "@openstatus/icons";
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
    <EmptyStateContainer className="gap-3">
      <Team aria-hidden="true" className="text-muted-foreground size-8" />
      <EmptyStateTitle className="font-medium">No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Add subscribers to keep them informed about status updates.
      </EmptyStateDescription>
      <Button onClick={onAddSubscriber}>
        <Add />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
