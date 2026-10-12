import { Team, Add } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export interface SubscribersEmptyStateProps
  extends React.ComponentProps<typeof EmptyStateContainer> {
  onAddSubscriber?: () => void;
}

export function SubscribersEmptyState({
  onAddSubscriber,
  onClick,
  children,
  ...props
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer {...props}>
      <div className="text-muted-foreground bg-muted flex h-10 w-10 items-center justify-center rounded-full">
        <Team className="h-5 w-5" />
      </div>
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page.
      </EmptyStateDescription>
      <div className="mt-2">
        {children ?? (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddSubscriber ?? onClick}
          >
            <Add /> Add subscriber
          </Button>
        )}
      </div>
    </EmptyStateContainer>
  );
}
