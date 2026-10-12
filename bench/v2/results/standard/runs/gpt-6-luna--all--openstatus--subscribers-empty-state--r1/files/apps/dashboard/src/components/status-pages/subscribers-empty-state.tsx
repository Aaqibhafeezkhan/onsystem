import { StatusBlankContainer, StatusBlankContent, StatusBlankDescription, StatusBlankTitle } from "@openstatus/ui/components/blocks/status-blank";
import { Button } from "@openstatus/ui/components/ui/button";
import { UserPlus } from "lucide-react";

type SubscribersEmptyStateProps = {
  onAddSubscriber?: () => void;
};

export function SubscribersEmptyState({
  onAddSubscriber,
}: SubscribersEmptyStateProps) {
  return (
    <StatusBlankContainer>
      <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UserPlus aria-hidden="true" className="size-6" />
      </div>
      <StatusBlankContent>
        <StatusBlankTitle>No subscribers yet</StatusBlankTitle>
        <StatusBlankDescription>
          Add a subscriber to keep them informed about status updates.
        </StatusBlankDescription>
      </StatusBlankContent>
      <Button onClick={onAddSubscriber}>
        <UserPlus aria-hidden="true" />
        Add subscriber
      </Button>
    </StatusBlankContainer>
  );
}
