"use client";

import { Team, Add } from "@openstatus/icons";
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
  buttonProps?: React.ComponentProps<typeof Button>;
}

export function SubscribersEmptyState({
  onAddSubscriber,
  buttonProps,
  className,
  onClick,
  ...props
}: SubscribersEmptyStateProps) {
  const handleClick = onAddSubscriber ?? onClick ?? buttonProps?.onClick;

  return (
    <EmptyStateContainer className={cn("py-8", className)} {...props}>
      <div className="border-border bg-muted flex size-10 items-center justify-center rounded-full border">
        <Team className="text-muted-foreground size-5" />
      </div>
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page yet.
      </EmptyStateDescription>
      <Button
        variant="outline"
        size="sm"
        {...buttonProps}
        onClick={handleClick}
        className={cn("mt-2", buttonProps?.className)}
      >
        <Add className="size-4" />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
