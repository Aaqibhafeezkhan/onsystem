import { Add, Email } from "@openstatus/icons";
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
    <EmptyStateContainer className="min-h-64 gap-3">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
        <Email aria-hidden="true" />
      </div>
      <EmptyStateTitle className="font-medium">No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Add subscribers to keep people informed about status updates.
      </EmptyStateDescription>
      <Button onClick={onAddSubscriber} size="sm">
        <Add /> Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
