import { UserRoundPlus } from "lucide-react";

import { Button } from "@openstatus/ui/components/ui/button";
import {
  StatusBlankContainer,
  StatusBlankContent,
  StatusBlankDescription,
  StatusBlankTitle,
} from "@openstatus/ui/components/blocks/status-blank";

type SubscribersEmptyStateProps = {
  onAddSubscriber?: () => void;
};

export function SubscribersEmptyState({
  onAddSubscriber,
}: SubscribersEmptyStateProps) {
  return (
    <StatusBlankContainer className="gap-4 p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg border bg-background text-muted-foreground">
        <UserRoundPlus aria-hidden="true" className="size-5" />
      </div>
      <StatusBlankContent>
        <StatusBlankTitle>No subscribers yet</StatusBlankTitle>
        <StatusBlankDescription>
          Add a subscriber to keep them informed about status updates.
        </StatusBlankDescription>
      </StatusBlankContent>
      <Button onClick={onAddSubscriber}>
        <UserRoundPlus aria-hidden="true" />
        Add subscriber
      </Button>
    </StatusBlankContainer>
  );
}
