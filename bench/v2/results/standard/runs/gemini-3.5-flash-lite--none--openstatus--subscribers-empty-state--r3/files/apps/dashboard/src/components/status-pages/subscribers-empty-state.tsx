"use client";

import { Add, Team } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export interface SubscribersEmptyStateProps
  extends React.ComponentProps<typeof EmptyStateContainer> {
  onAddSubscriber?: () => void;
  onClick?: () => void;
  action?: React.ReactNode;
}

export function SubscribersEmptyState({
  onAddSubscriber,
  onClick,
  action,
  ...props
}: SubscribersEmptyStateProps) {
  const handleAdd = onAddSubscriber ?? onClick;

  return (
    <EmptyStateContainer {...props}>
      <Team className="text-muted-foreground size-8" />
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page.
      </EmptyStateDescription>
      {action ? (
        <div className="mt-2">{action}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={handleAdd} className="mt-2">
          <Add /> Add subscriber
        </Button>
      )}
    </EmptyStateContainer>
  );
}
