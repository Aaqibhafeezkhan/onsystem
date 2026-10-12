"use client";

import { Button } from "@openstatus/ui/components/ui/button";
import { Users } from "lucide-react";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export type SubscribersEmptyStateProps = {
  onAddSubscriber?: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<typeof EmptyStateContainer>, "children">;

export function SubscribersEmptyState({
  onAddSubscriber,
  title = "No subscribers",
  description = "Add subscribers to receive notifications when incidents or maintenance occur.",
  children,
  ...props
}: SubscribersEmptyStateProps) {
  return (
    <EmptyStateContainer {...props}>
      <div className="text-muted-foreground flex size-10 items-center justify-center rounded-full bg-muted">
        <Users className="size-5" />
      </div>
      <EmptyStateTitle>{title}</EmptyStateTitle>
      <EmptyStateDescription>{description}</EmptyStateDescription>
      {children ? (
        children
      ) : onAddSubscriber ? (
        <Button size="sm" onClick={onAddSubscriber} className="mt-2">
          Add subscriber
        </Button>
      ) : null}
    </EmptyStateContainer>
  );
}
