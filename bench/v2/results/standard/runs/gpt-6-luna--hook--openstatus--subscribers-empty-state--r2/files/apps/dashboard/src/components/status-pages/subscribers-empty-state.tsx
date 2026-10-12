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
    <EmptyStateContainer className="gap-3 p-8">
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Team aria-hidden="true" className="size-6" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <EmptyStateTitle className="text-lg font-medium">
          No subscribers yet
        </EmptyStateTitle>
        <EmptyStateDescription>
          Add subscribers to keep them informed about updates to your status
          page.
        </EmptyStateDescription>
      </div>
      <Button onClick={onAddSubscriber}>
        <Add aria-hidden="true" />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
