"use client";

import type { ComponentProps } from "react";
import { Add, Team } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export interface SubscribersEmptyStateProps
  extends ComponentProps<typeof EmptyStateContainer> {
  onAddSubscriber?: () => void;
  onClick?: () => void;
}

export function SubscribersEmptyState({
  onAddSubscriber,
  onClick,
  children,
  ...props
}: SubscribersEmptyStateProps) {
  const handleAdd = onAddSubscriber ?? onClick;

  return (
    <EmptyStateContainer {...props}>
      <div className="text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full border border-dashed">
        <Team className="h-5 w-5" />
      </div>
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page.
      </EmptyStateDescription>
      {children ? (
        <div className="mt-2">{children}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="mt-2"
        >
          <Add /> Add subscriber
        </Button>
      )}
    </EmptyStateContainer>
  );
}
