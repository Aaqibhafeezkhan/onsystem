"use client";

import { Add, Team } from "@openstatus/icons";
import { Button } from "@openstatus/ui/components/ui/button";
import { cn } from "@openstatus/ui/lib/utils";

import {
  EmptyStateContainer,
  EmptyStateDescription,
  EmptyStateTitle,
} from "@/components/content/empty-state";

export function SubscribersEmptyState({
  className,
  onClick,
  onAdd,
  children,
  ...props
}: React.ComponentProps<typeof EmptyStateContainer> & {
  onClick?: () => void;
  onAdd?: () => void;
}) {
  const handleAdd = onClick || onAdd;

  return (
    <EmptyStateContainer className={cn("py-8", className)} {...props}>
      <Team className="text-muted-foreground size-8" />
      <EmptyStateTitle>No subscribers</EmptyStateTitle>
      <EmptyStateDescription>
        Nobody has been subscribed to this status page.
      </EmptyStateDescription>
      {children ? (
        children
      ) : (
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Add /> Add subscriber
        </Button>
      )}
    </EmptyStateContainer>
  );
}
