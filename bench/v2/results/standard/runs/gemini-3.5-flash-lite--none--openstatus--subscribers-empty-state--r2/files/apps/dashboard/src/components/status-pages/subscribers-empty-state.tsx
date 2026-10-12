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
  onAdd?: () => void;
  buttonProps?: React.ComponentProps<typeof Button>;
}

export function SubscribersEmptyState({
  onAdd,
  buttonProps,
  className,
  children,
  ...props
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer className={cn("py-8", className)} {...props}>
      <Team className="text-muted-foreground size-8" />
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page.
      </EmptyStateDescription>
      {children ?? (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={onAdd}
          {...buttonProps}
        >
          <Add /> Add subscriber
        </Button>
      )}
    </EmptyStateContainer>
  );
}
