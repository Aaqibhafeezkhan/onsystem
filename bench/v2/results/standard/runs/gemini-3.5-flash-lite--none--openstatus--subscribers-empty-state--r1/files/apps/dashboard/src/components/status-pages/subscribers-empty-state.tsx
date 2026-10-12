"use client";

import { Add, Team } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";
import type { ComponentProps } from "react";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export interface SubscribersEmptyStateProps
  extends ComponentProps<typeof EmptyStateContainer> {
  onAdd?: () => void;
  onClick?: () => void;
}

export function SubscribersEmptyState({
  onAdd,
  onClick,
  children,
  ...props
}: SubscribersEmptyStateProps) {
  const handleClick = onAdd ?? onClick;

  return (
    <EmptyStateContainer {...props}>
      <div className="text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full border border-dashed">
        <Team className="h-5 w-5" />
      </div>
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page.
      </EmptyStateDescription>
      {children ?? (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={handleClick}
        >
          <Add /> Add subscriber
        </Button>
      )}
    </EmptyStateContainer>
  );
}
