"use client";

import { Add, Email } from "@openstatus/icons";
import {
  StatusBlankContainer,
  StatusBlankDescription,
  StatusBlankTitle,
} from "@openstatus/ui/components/blocks/status-blank";
import { Button } from "@openstatus/ui/components/ui/button";

export interface SubscribersEmptyStateProps {
  onAddSubscriber?: () => void;
}

export function SubscribersEmptyState({
  onAddSubscriber,
}: SubscribersEmptyStateProps = {}) {
  return (
    <StatusBlankContainer>
      <Email aria-hidden="true" className="size-8 text-muted-foreground" />
      <StatusBlankTitle role="heading" aria-level={2}>
        No subscribers yet
      </StatusBlankTitle>
      <StatusBlankDescription>
        Add subscribers to keep them informed about status updates.
      </StatusBlankDescription>
      <Button type="button" onClick={onAddSubscriber}>
        <Add aria-hidden="true" />
        Add subscriber
      </Button>
    </StatusBlankContainer>
  );
}
