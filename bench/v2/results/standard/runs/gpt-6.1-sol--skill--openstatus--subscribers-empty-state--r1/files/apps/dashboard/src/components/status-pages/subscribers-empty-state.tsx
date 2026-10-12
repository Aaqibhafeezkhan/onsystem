"use client";

import { Add, Team } from "@openstatus/icons";
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
    <EmptyStateContainer className="py-8">
      <Team aria-hidden="true" className="text-muted-foreground size-8" />
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription>
        Add subscribers to keep them informed about status page updates.
      </EmptyStateDescription>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddSubscriber}
      >
        <Add aria-hidden="true" />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
