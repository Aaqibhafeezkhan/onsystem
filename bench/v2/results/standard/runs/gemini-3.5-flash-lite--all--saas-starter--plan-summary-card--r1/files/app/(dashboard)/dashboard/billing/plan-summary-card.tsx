'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string;
  renewalDate?: string;
  onManageSubscription?: () => void;
  action?: string | ((formData: FormData) => void | Promise<void>);
}

export function PlanSummaryCard({
  planName = 'Pro Plan',
  monthlyPrice = '$29/month',
  renewalDate = 'Next renewal on November 15, 2025',
  onManageSubscription,
  action,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-medium">{planName}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {renewalDate}
          </CardDescription>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-chart-2/15 text-chart-2">
          Active
        </span>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-3xl font-medium text-card-foreground">
              {monthlyPrice}
            </span>
          </div>
          {action ? (
            <form action={action}>
              <Button type="submit" variant="outline">
                Manage subscription
              </Button>
            </form>
          ) : (
            <Button type="button" variant="outline" onClick={onManageSubscription}>
              Manage subscription
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
