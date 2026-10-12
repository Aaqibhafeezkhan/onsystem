"use client";

import { Add, Notification } from "@openstatus/icons";
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
    <EmptyStateContainer>
      <Notification aria-hidden="true" className="text-muted-foreground size-8" />
      <EmptyStateTitle className="font-medium">No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Add subscribers to keep them informed about status page updates.
      </EmptyStateDescription>
      <Button variant="outline" size="sm" onClick={onAddSubscriber}>
        <Add /> Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
