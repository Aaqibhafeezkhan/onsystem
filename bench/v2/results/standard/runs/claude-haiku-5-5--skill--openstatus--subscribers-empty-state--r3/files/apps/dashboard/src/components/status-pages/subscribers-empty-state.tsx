import { Button } from "@openstatus/ui/components/ui/button";
import { Users } from "lucide-react";

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
      <Users aria-hidden className="text-muted-foreground size-6" />
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Add subscribers to notify them by email when this status page publishes
        an update.
      </EmptyStateDescription>
      <Button size="sm" className="mt-2" onClick={onAddSubscriber}>
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
