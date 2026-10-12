"use client";

import { Account, Add } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";
import { cn } from "@/lib/utils";

export interface SubscribersEmptyStateProps
  extends React.ComponentProps<typeof EmptyStateContainer> {
  onClick?: React.ComponentProps<typeof Button>["onClick"];
  buttonProps?: React.ComponentProps<typeof Button>;
}

export function SubscribersEmptyState({
  children,
  onClick,
  buttonProps,
  className,
  ...props
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer className={cn("gap-3 py-8", className)} {...props}>
      <Account className="text-muted-foreground size-8" />
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page.
      </EmptyStateDescription>
      {children ?? (
        <Button
          variant="outline"
          size="sm"
          onClick={onClick}
          {...buttonProps}
          className="mt-1"
        >
          <Add /> Add subscriber
        </Button>
      )}
    </EmptyStateContainer>
  );
}
