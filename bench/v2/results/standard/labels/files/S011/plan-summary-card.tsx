'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string | number;
  price?: string | number;
  nextRenewalDate?: string;
  renewalDate?: string;
  status?: string;
  statusLabel?: string;
  onManageSubscription?: () => void;
  className?: string;
}

export function PlanSummaryCard({
  planName = 'Pro',
  monthlyPrice,
  price,
  nextRenewalDate,
  renewalDate,
  status,
  statusLabel,
  onManageSubscription,
  className
}: PlanSummaryCardProps) {
  const currentPlan = planName;
  const activeStatus = status ?? statusLabel ?? 'Active';
  const renewal = nextRenewalDate ?? renewalDate ?? 'July 1, 2025';

  const rawPrice = monthlyPrice ?? price;
  const priceValue =
    rawPrice !== undefined && rawPrice !== null
      ? typeof rawPrice === 'number'
        ? `$${rawPrice}`
        : rawPrice
      : '$20';

  const hasInterval =
    typeof priceValue === 'string' &&
    (priceValue.includes('/') || priceValue.toLowerCase().includes('month'));

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Plan Summary</CardTitle>
            <CardDescription>
              Your subscription plan and billing details
            </CardDescription>
          </div>
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 w-fit">
            {activeStatus}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              Current plan
            </span>
            <p className="text-lg font-semibold text-foreground">
              {currentPlan}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              Monthly price
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold text-foreground">
                {priceValue}
              </span>
              {!hasInterval && (
                <span className="text-sm text-muted-foreground">/ month</span>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-muted-foreground">
              Next renewal date
            </span>
            <p className="text-lg font-semibold text-foreground">
              {renewal}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onManageSubscription}
        >
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  );
}

export default PlanSummaryCard;
