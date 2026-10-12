"use client";

import { Email } from "@openstatus/icons";
import {
  StatusBlankContainer,
  StatusBlankContent,
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
      <Email
        aria-hidden="true"
        className="size-8 text-muted-foreground"
      />
      <StatusBlankContent>
        <StatusBlankTitle role="heading" aria-level={2}>
          No subscribers yet
        </StatusBlankTitle>
        <StatusBlankDescription>
          Add your first subscriber to keep them informed about status updates.
        </StatusBlankDescription>
      </StatusBlankContent>
      <Button type="button" onClick={onAddSubscriber}>
        Add subscriber
      </Button>
    </StatusBlankContainer>
  );
}
