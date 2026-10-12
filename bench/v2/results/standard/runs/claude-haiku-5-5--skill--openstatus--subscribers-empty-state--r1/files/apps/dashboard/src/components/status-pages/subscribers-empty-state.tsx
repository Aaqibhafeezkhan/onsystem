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
    <EmptyStateContainer className="py-8">
      <div className="bg-muted mb-2 flex size-10 items-center justify-center rounded-full">
        <Email className="text-muted-foreground size-5" />
      </div>
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has subscribed to this status page. Add a subscriber to start
        sending them updates.
      </EmptyStateDescription>
      <Button variant="outline" size="sm" className="mt-2" onClick={onAddSubscriber}>
        <Add /> Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
