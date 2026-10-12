import { Add, Email } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export function SubscribersEmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyStateContainer>
      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
        <Email className="size-5" />
      </div>
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has subscribed to this status page yet. Add a subscriber to send
        them updates about incidents and maintenance.
      </EmptyStateDescription>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={onAdd}
      >
        <Add /> Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
