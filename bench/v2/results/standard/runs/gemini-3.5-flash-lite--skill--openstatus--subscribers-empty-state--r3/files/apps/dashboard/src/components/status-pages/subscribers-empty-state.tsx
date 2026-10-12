"use client";

import { Add, Team } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";
import * as React from "react";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export interface SubscribersEmptyStateProps
  extends React.ComponentProps<typeof EmptyStateContainer> {
  onAdd?: () => void;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function SubscribersEmptyState({
  onAdd,
  onClick,
  children,
  className,
  ...props
}: SubscribersEmptyStateProps) {
  const handleClick = onAdd ?? onClick;

  return (
    <EmptyStateContainer className={className} {...props}>
      <Team className="text-muted-foreground size-8" />
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page.
      </EmptyStateDescription>
      {children ?? (
        <Button variant="outline" size="sm" onClick={handleClick}>
          <Add /> Add subscriber
        </Button>
      )}
    </EmptyStateContainer>
  );
}
