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
import { customerPortalAction } from '@/lib/payments/actions';
import { cn } from '@/lib/utils';

export interface PlanSummaryCardProps {
  planName?: string;
  price?: string | number;
  interval?: string;
  renewalDate?: string | Date;
  status?: string;
  onManageSubscription?: () => void;
  action?: ((formData: FormData) => void | Promise<void>) | string;
  className?: string;
}

function formatPrice(price?: string | number, interval: string = 'month'): string {
  if (price === undefined || price === null) {
    return `$20 / ${interval}`;
  }
  if (typeof price === 'number') {
    return `$${price} / ${interval}`;
  }
  const str = price.trim();
  if (str.includes('/') || str.toLowerCase().includes('per')) {
    return str;
  }
  const formattedAmount = str.startsWith('$') ? str : `$${str}`;
  return `${formattedAmount} / ${interval}`;
}

function formatRenewalDate(date?: string | Date): string {
  if (!date) {
    return 'May 1, 2025';
  }
  if (date instanceof Date) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
  return date;
}

export function PlanSummaryCard({
  planName = 'Pro',
  price,
  interval = 'month',
  renewalDate,
  status = 'Active',
  onManageSubscription,
  action,
  className
}: PlanSummaryCardProps) {
  const formattedPrice = formatPrice(price, interval);
  const formattedRenewalDate = formatRenewalDate(renewalDate);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardDescription className="text-sm font-medium">
              Current Plan
            </CardDescription>
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {planName}
              </CardTitle>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-chart-2/10 px-2.5 py-0.5 text-xs font-medium text-chart-2 border border-chart-2/20">
                <span className="h-1.5 w-1.5 rounded-full bg-chart-2" />
                {status}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Monthly price
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
              {formattedPrice}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Next renewal date
            </p>
            <p className="text-base font-medium text-foreground mt-2">
              {formattedRenewalDate}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t border-border pt-6">
        <form action={action || customerPortalAction}>
          <Button
            variant="outline"
            type={onManageSubscription ? 'button' : 'submit'}
            onClick={onManageSubscription}
          >
            Manage subscription
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

export default PlanSummaryCard;
