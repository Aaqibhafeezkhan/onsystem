import { Users } from "lucide-react";

import {
  StatusBlankAction,
  StatusBlankContainer,
  StatusBlankContent,
  StatusBlankDescription,
  StatusBlankTitle,
} from "@openstatus/ui/components/blocks/status-blank";
import { Button } from "@openstatus/ui/components/ui/button";

interface SubscribersEmptyStateProps {
  onAddSubscriber?: () => void;
}

export function SubscribersEmptyState({ onAddSubscriber }: SubscribersEmptyStateProps) {
  return (
    <StatusBlankContainer>
      <div className="flex size-10 items-center justify-center rounded-full border bg-background text-muted-foreground">
        <Users className="size-5" aria-hidden="true" />
      </div>
      <StatusBlankContent>
        <StatusBlankTitle>No subscribers yet</StatusBlankTitle>
        <StatusBlankDescription>
          Add subscribers so they can receive updates about incidents and maintenances on this
          status page.
        </StatusBlankDescription>
      </StatusBlankContent>
      <StatusBlankAction>
        <Button onClick={onAddSubscriber}>Add subscriber</Button>
      </StatusBlankAction>
    </StatusBlankContainer>
  );
}
