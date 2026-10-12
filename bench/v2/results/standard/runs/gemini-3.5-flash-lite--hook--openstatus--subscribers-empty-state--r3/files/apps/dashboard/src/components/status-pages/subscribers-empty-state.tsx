"use client";

import { Add, Team } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";
import { cn } from "@/lib/utils";

export interface SubscribersEmptyStateProps
  extends React.ComponentProps<typeof EmptyStateContainer> {
  onAddSubscriber?: () => void;
}

export function SubscribersEmptyState({
  onAddSubscriber,
  children,
  className,
  ...props
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer
      className={cn("gap-3 py-10", className)}
      {...props}
    >
      <Team className="text-muted-foreground size-8" />
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page.
      </EmptyStateDescription>
      {children ? (
        children
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={onAddSubscriber}
        >
          <Add /> Add subscriber
        </Button>
      )}
    </EmptyStateContainer>
  );
}
