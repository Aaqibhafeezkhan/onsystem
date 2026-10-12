import { Button } from "@openstatus/ui/components/ui/button";
import {
  StatusBlankAction,
  StatusBlankContainer,
  StatusBlankContent,
  StatusBlankDescription,
  StatusBlankTitle,
} from "@openstatus/ui/components/blocks/status-blank";
import { Users } from "lucide-react";

interface SubscribersEmptyStateProps {
  onAddSubscriber?: () => void;
}

export function SubscribersEmptyState({
  onAddSubscriber,
}: SubscribersEmptyStateProps) {
  return (
    <StatusBlankContainer>
      <Users aria-hidden="true" className="size-6 text-muted-foreground" />
      <StatusBlankContent>
        <StatusBlankTitle>No subscribers yet</StatusBlankTitle>
        <StatusBlankDescription>
          Add subscribers to notify them about incidents and maintenance on
          this status page.
        </StatusBlankDescription>
      </StatusBlankContent>
      <StatusBlankAction>
        <Button type="button" onClick={onAddSubscriber}>
          Add subscriber
        </Button>
      </StatusBlankAction>
    </StatusBlankContainer>
  );
}
