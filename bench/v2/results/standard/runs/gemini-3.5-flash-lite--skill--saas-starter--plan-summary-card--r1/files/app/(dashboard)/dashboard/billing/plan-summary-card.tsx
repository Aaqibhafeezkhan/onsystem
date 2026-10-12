'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';
import { cn } from '@/lib/utils';

export interface PlanSummaryCardProps extends React.ComponentProps<typeof Card> {
  planName?: string;
  monthlyPrice?: string;
  nextRenewalDate?: string;
  action?: string | ((formData: FormData) => void | Promise<void>);
}

export function PlanSummaryCard({
  planName = 'Base',
  monthlyPrice = '$8.00',
  nextRenewalDate = 'November 1, 2025',
  action = customerPortalAction,
  className,
  ...props
}: PlanSummaryCardProps) {
  return (
    <Card className={cn('', className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Current Plan</CardTitle>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
          Active
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0 space-y-1">
              <p className="font-medium text-lg">{planName}</p>
              <p className="text-sm text-muted-foreground">
                Monthly price: {monthlyPrice}
              </p>
              <p className="text-sm text-muted-foreground">
                Next renewal date: {nextRenewalDate}
              </p>
            </div>
            <form action={action}>
              <Button type="submit" variant="outline">
                Manage subscription
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
