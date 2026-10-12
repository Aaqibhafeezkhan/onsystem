'use client';

import * as React from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PlanSummaryCardProps
  extends React.ComponentProps<typeof Card> {
  planName?: string;
  plan?: string;
  monthlyPrice?: string | number;
  price?: string | number;
  renewalDate?: string;
  nextRenewalDate?: string;
  status?: string;
  buttonText?: string;
  onManageSubscription?: () => void;
  action?: string | ((formData: FormData) => void | Promise<void>);
}

export function PlanSummaryCard({
  planName,
  plan,
  monthlyPrice,
  price,
  renewalDate,
  nextRenewalDate,
  status = 'Active',
  buttonText = 'Manage subscription',
  onManageSubscription,
  action,
  className,
  ...props
}: PlanSummaryCardProps) {
  const currentPlanName = planName ?? plan ?? 'Pro';
  const rawPrice = monthlyPrice ?? price;
  const currentMonthlyPrice =
    rawPrice !== undefined && rawPrice !== null
      ? typeof rawPrice === 'number'
        ? `$${rawPrice}/month`
        : rawPrice
      : '$20/month';
  const currentRenewalDate =
    renewalDate ?? nextRenewalDate ?? 'May 1, 2025';

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {currentPlanName}
        </CardTitle>
        <CardDescription>Current Plan</CardDescription>
        <CardAction>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-950/50 dark:text-green-400 dark:ring-green-500/30">
            <span
              className="size-1.5 rounded-full bg-green-500 dark:bg-green-400"
              aria-hidden="true"
            />
            {status}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Monthly Price
          </p>
          <p className="text-2xl font-bold">{currentMonthlyPrice}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Next Renewal Date
          </p>
          <p className="text-lg font-semibold">{currentRenewalDate}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-6">
        {action ? (
          <form action={action}>
            <Button type="submit" variant="outline">
              {buttonText}
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onManageSubscription}
          >
            {buttonText}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default PlanSummaryCard;
