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
  onAddSubscriber: () => void;
}) {
  return (
    <EmptyStateContainer className="gap-3 py-10">
      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
        <Team className="size-5" />
      </div>
      <div className="space-y-1">
        <EmptyStateTitle className="text-center font-medium">
          No subscribers yet
        </EmptyStateTitle>
        <EmptyStateDescription>
          Add subscribers to keep them informed about status page updates.
        </EmptyStateDescription>
      </div>
      <Button onClick={onAddSubscriber} size="sm">
        <Add />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
