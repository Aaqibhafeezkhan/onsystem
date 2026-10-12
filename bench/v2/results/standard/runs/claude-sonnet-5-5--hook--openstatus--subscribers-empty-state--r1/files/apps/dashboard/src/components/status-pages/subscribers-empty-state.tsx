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
      <Users className="text-muted-foreground size-6" aria-hidden="true" />
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Subscribers get notified by email when you report incidents or
        maintenance on this status page.
      </EmptyStateDescription>
      <Button
        type="button"
        size="sm"
        className="mt-2"
        onClick={onAddSubscriber}
      >
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
