'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';

export interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string | number;
  nextRenewalDate?: string;
  manageSubscriptionAction?: string | ((formData: FormData) => void | Promise<void>);
}

export function PlanSummaryCard({
  planName = 'Pro Plan',
  monthlyPrice = '$19/month',
  nextRenewalDate = 'November 1, 2024',
  manageSubscriptionAction = customerPortalAction,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Plan Summary</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-chart-2/10 text-chart-2">
            Active
          </span>
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-lg font-semibold text-foreground">
                {planName}
              </p>
              <p className="text-sm text-muted-foreground">{monthlyPrice}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Next renewal date: {nextRenewalDate}
              </p>
            </div>
            <form action={manageSubscriptionAction}>
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
