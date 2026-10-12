import * as React from "react";
import { Users } from "lucide-react";
import { Button } from "@openstatus/ui/components/ui/button";
import {
  EmptyStateContainer,
  EmptyStateTitle,
  EmptyStateDescription,
} from "@/components/content/empty-state";
import { cn } from "@/lib/utils";

export interface SubscribersEmptyStateProps
  extends React.ComponentProps<typeof EmptyStateContainer> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onAdd?: () => void;
  onClick?: () => void;
  action?: React.ReactNode;
}

export function SubscribersEmptyState({
  title = "No subscribers",
  description = "Nobody has been subscribed to this status page.",
  onAdd,
  onClick,
  action,
  children,
  className,
  ...props
}: SubscribersEmptyStateProps) {
  const handleClick = onAdd ?? onClick;

  return (
    <EmptyStateContainer className={cn("gap-4 p-8", className)} {...props}>
      <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
        <Users className="text-muted-foreground h-6 w-6" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <EmptyStateTitle className="font-semibold">
          {title}
        </EmptyStateTitle>
        <EmptyStateDescription>{description}</EmptyStateDescription>
      </div>
      {action ? (
        action
      ) : children ? (
        children
      ) : (
        <Button onClick={handleClick} size="sm">
          Add subscriber
        </Button>
      )}
    </EmptyStateContainer>
  );
}
