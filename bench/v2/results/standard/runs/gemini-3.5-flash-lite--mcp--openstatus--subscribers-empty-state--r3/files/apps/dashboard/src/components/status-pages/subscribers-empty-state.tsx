"use client";

import { Plus, Users } from "lucide-react";
import { Button } from "@openstatus/ui/components/ui/button";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export interface SubscribersEmptyStateProps
  extends React.ComponentProps<typeof EmptyStateContainer> {
  onAddSubscriber?: () => void;
}

export function SubscribersEmptyState({
  onAddSubscriber,
  className,
  ...props
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer className={className} {...props}>
      <div className="bg-muted-foreground/10 mb-1 flex size-10 items-center justify-center rounded-full">
        <Users className="text-muted-foreground size-5" />
      </div>
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Add subscribers to keep them informed about status updates and incidents.
      </EmptyStateDescription>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={onAddSubscriber}
      >
        <Plus className="mr-1.5 size-4" />
        Add subscriber
      </Button>
    </EmptyStateContainer>
  );
}
