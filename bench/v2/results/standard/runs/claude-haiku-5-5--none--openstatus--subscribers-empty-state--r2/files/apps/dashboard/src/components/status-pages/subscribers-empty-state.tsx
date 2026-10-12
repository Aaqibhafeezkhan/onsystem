import { Add, Team } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";
import { cn } from "@/lib/utils";

interface SubscribersEmptyStateProps {
  onAddSubscriber?: () => void;
  className?: string;
}

export function SubscribersEmptyState({
  onAddSubscriber,
  className,
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer className={cn("py-8", className)}>
      <div className="bg-muted text-muted-foreground mb-2 flex size-10 items-center justify-center rounded-full">
        <Team className="size-5" />
      </div>
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription className="max-w-sm">
        Nobody has subscribed to this status page yet. Add subscribers to keep
        them informed about incidents and maintenances.
      </EmptyStateDescription>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={onAddSubscriber}
      >
        <Add /> Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
