import { Add, Team } from "@openstatus/icons";
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
    <EmptyStateContainer className="min-h-64">
      <div className="bg-muted text-muted-foreground mb-2 flex size-10 items-center justify-center rounded-full">
        <Team className="size-5" />
      </div>
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Add subscribers to keep people informed about updates to this status page.
      </EmptyStateDescription>
      <Button className="mt-2" onClick={onAddSubscriber}>
        <Add /> Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
