import {
  StatusBlankContainer,
  StatusBlankContent,
  StatusBlankDescription,
  StatusBlankTitle,
} from "@openstatus/ui/components/blocks/status-blank";
import { Button } from "@openstatus/ui/components/ui/button";
import { Users } from "lucide-react";

export function SubscribersEmptyState({
  onAddSubscriber,
}: {
  onAddSubscriber?: () => void;
}) {
  return (
    <StatusBlankContainer className="flex-col gap-4 text-center">
      <Users className="size-8 text-muted-foreground" aria-hidden="true" />
      <StatusBlankContent>
        <StatusBlankTitle>No subscribers yet</StatusBlankTitle>
        <StatusBlankDescription>
          Add subscribers to notify them about incidents and maintenance on
          this status page.
        </StatusBlankDescription>
      </StatusBlankContent>
      <Button type="button" onClick={onAddSubscriber}>
        Add subscriber
      </Button>
    </StatusBlankContainer>
  );
}
