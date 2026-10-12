"use client";

import { Add, Team } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export type SubscribersEmptyStateProps = {
  onAddSubscriber?: () => void;
  onClick?: () => void;
} & React.ComponentProps<typeof EmptyStateContainer>;

export function SubscribersEmptyState({
  onAddSubscriber,
  onClick,
  className,
  children,
  ...props
}: SubscribersEmptyStateProps) {
  const handleAdd = onAddSubscriber ?? onClick;

  return (
    <EmptyStateContainer className={className} {...props}>
      <div className="text-muted-foreground mb-1 flex items-center justify-center">
        <Team className="h-6 w-6" />
      </div>
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page yet.
      </EmptyStateDescription>
      <Button size="sm" className="mt-2" onClick={handleAdd}>
        <Add />
        Add subscriber
      </Button>
      {children}
    </EmptyStateContainer>
  );
}
