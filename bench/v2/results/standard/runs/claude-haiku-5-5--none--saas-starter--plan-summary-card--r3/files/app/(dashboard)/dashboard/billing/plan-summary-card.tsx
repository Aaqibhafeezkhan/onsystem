'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export type PlanSummaryCardProps = {
  planName: string;
  monthlyPrice: number;
  renewalDate: Date;
  currency?: string;
  onManageSubscription?: () => void;
};

const priceFormatter = (currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  renewalDate,
  currency = 'USD',
  onManageSubscription
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {planName}
          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
            Active
          </span>
        </CardTitle>
        <CardDescription>Your current subscription plan</CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onManageSubscription}
          >
            Manage subscription
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold text-card-foreground">
          {priceFormatter(currency).format(monthlyPrice)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / month
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Next renewal:{' '}
          <time dateTime={renewalDate.toISOString()}>
            {dateFormatter.format(renewalDate)}
          </time>
        </p>
      </CardContent>
    </Card>
  );
}
