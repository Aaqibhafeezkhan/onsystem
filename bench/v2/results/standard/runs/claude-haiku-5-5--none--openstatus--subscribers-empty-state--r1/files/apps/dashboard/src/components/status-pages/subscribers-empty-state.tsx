"use client";

import { Add, Email } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

interface SubscribersEmptyStateProps {
  onAddSubscriber?: () => void;
}

export function SubscribersEmptyState({
  onAddSubscriber,
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer className="py-8">
      <div className="bg-muted text-muted-foreground mb-2 flex size-10 items-center justify-center rounded-full">
        <Email size={20} aria-hidden="true" />
      </div>
      <EmptyStateTitle>No subscribers yet</EmptyStateTitle>
      <EmptyStateDescription className="max-w-sm">
        Nobody is subscribed to this status page. Add subscribers so they get
        notified about incidents and maintenances.
      </EmptyStateDescription>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={onAddSubscriber}
      >
        <Add size={16} aria-hidden="true" />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
