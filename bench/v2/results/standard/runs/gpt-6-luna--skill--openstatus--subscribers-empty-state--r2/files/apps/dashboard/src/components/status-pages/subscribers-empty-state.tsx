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
    <EmptyStateContainer className="gap-3 py-8">
      <Notification aria-hidden="true" className="size-8 text-muted-foreground" />
      <div className="flex flex-col items-center gap-1">
        <EmptyStateTitle className="font-medium">No subscribers yet</EmptyStateTitle>
        <EmptyStateDescription>
          Nobody has been subscribed to this status page.
        </EmptyStateDescription>
      </div>
      <Button variant="outline" size="sm" onClick={onAddSubscriber}>
        <Add /> Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
