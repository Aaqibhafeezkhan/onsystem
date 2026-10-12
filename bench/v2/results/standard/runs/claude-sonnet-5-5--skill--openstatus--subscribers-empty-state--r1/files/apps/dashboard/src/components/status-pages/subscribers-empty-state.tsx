import { Add, Email } from "@openstatus/icons";
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
      <Email className="text-muted-foreground size-6" aria-hidden="true" />
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Subscribers get notified by email when you publish updates to this
        status page.
      </EmptyStateDescription>
      <Button type="button" onClick={onAddSubscriber}>
        <Add />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
