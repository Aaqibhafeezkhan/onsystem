"use client";

import { Add, Notification } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export interface SubscribersEmptyStateProps
  extends React.ComponentProps<typeof EmptyStateContainer> {
  onAdd?: () => void;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function SubscribersEmptyState({
  onAdd,
  title = "No subscribers",
  description = "Nobody has been subscribed to this status page.",
  action,
  className,
  ...props
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer className={className} {...props}>
      <div className="border-border bg-muted flex size-10 items-center justify-center rounded-full border">
        <Notification className="text-muted-foreground size-5" />
      </div>
      <EmptyStateTitle>{title}</EmptyStateTitle>
      <EmptyStateDescription>{description}</EmptyStateDescription>
      {action ?? (
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Add /> Add subscriber
          </Button>
        </div>
      )}
    </EmptyStateContainer>
  );
}
