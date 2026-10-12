import { Add, Team } from "@openstatus/icons";
import {
  StatusBlankContainer,
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
    <StatusBlankContainer className="gap-4">
      <Team aria-hidden="true" className="size-8 text-muted-foreground" />
      <div className="space-y-2 text-center">
        <StatusBlankTitle>No subscribers yet</StatusBlankTitle>
        <StatusBlankDescription>
          Add a subscriber to keep them informed about status page updates.
        </StatusBlankDescription>
      </div>
      <Button onClick={onAddSubscriber}>
        <Add aria-hidden="true" />
        Add subscriber
      </Button>
    </StatusBlankContainer>
  );
}
