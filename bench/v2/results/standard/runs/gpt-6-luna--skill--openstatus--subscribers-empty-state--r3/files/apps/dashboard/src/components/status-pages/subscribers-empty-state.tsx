import { Add } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";
import { UsersRound } from "lucide-react";

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
    <EmptyStateContainer>
      <UsersRound aria-hidden="true" className="text-muted-foreground mb-2 size-6" />
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page yet.
      </EmptyStateDescription>
      <Button className="mt-2" onClick={onAddSubscriber} size="sm">
        <Add /> Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
