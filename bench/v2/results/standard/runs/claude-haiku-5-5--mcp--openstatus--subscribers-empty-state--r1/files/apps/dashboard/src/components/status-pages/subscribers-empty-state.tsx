"use client";

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
    <EmptyStateContainer className="py-8">
      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
        <Team className="size-5" />
      </div>
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has subscribed to this status page yet. Add a subscriber to send
        them incident and maintenance updates.
      </EmptyStateDescription>
      <Button type="button" size="sm" className="mt-2" onClick={onAddSubscriber}>
        <Add />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
