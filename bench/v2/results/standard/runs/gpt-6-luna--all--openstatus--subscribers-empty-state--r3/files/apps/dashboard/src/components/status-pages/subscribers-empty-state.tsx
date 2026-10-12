import { UsersRound } from "lucide-react";

import {
  StatusBlankContainer,
  StatusBlankContent,
  StatusBlankDescription,
  StatusBlankTitle,
} from "@openstatus/ui/components/blocks/status-blank";
import { Button } from "@openstatus/ui/components/ui/button";

export function SubscribersEmptyState({
  onAddSubscriber,
}: {
  onAddSubscriber: () => void;
}) {
  return (
    <StatusBlankContainer>
      <UsersRound aria-hidden="true" className="size-8 text-muted-foreground" />
      <StatusBlankContent>
        <StatusBlankTitle>No subscribers yet</StatusBlankTitle>
        <StatusBlankDescription>
          Add subscribers to notify them about status page updates.
        </StatusBlankDescription>
      </StatusBlankContent>
      <Button onClick={onAddSubscriber} type="button">
        Add subscriber
      </Button>
    </StatusBlankContainer>
  );
}
