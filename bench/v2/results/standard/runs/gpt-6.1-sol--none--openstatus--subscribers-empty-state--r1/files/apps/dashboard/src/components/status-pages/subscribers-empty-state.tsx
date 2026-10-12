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
} = {}) {
  return (
    <EmptyStateContainer className="py-12">
      <Team aria-hidden="true" className="text-muted-foreground mb-2 size-8" />
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription className="max-w-sm">
        Add subscribers to keep them informed about incidents and updates on your
        status page.
      </EmptyStateDescription>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={onAddSubscriber}
      >
        <Add aria-hidden="true" />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
