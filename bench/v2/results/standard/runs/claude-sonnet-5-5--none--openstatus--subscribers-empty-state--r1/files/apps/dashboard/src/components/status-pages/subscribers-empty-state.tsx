import { Button } from "@openstatus/ui/components/ui/button";
import { Plus, Users } from "lucide-react";

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
      <Users className="text-muted-foreground size-6" aria-hidden="true" />
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Subscribers get notified by email when you publish updates on this
        status page.
      </EmptyStateDescription>
      <Button size="sm" className="mt-2" onClick={onAddSubscriber}>
        <Plus />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
