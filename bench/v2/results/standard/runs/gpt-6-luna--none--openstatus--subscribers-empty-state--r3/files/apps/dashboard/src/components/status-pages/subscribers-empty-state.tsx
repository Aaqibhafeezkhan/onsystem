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
  onAddSubscriber: () => void;
}) {
  return (
    <EmptyStateContainer className="gap-4 py-10">
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Team className="size-6" aria-hidden="true" />
      </div>
      <div className="grid gap-1">
        <EmptyStateTitle className="text-center text-base font-medium">
          No subscribers yet
        </EmptyStateTitle>
        <EmptyStateDescription>
          Add subscribers to keep people informed about status updates.
        </EmptyStateDescription>
      </div>
      <Button onClick={onAddSubscriber}>
        <Add />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
