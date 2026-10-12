'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';

interface PlanSummaryCardProps {
  planName?: string;
  price?: string;
  renewalDate?: string;
  onManageSubscription?: () => void;
}

export function PlanSummaryCard({
  planName = 'Pro Plan',
  price = '$29/month',
  renewalDate = 'November 1, 2025',
  onManageSubscription
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Plan Summary</CardTitle>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-chart-2/10 text-chart-2">
          <span className="h-1.5 w-1.5 rounded-full bg-chart-2" />
          Active
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-card-foreground">{planName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {price} • Next renewal on {renewalDate}
            </p>
          </div>
          {onManageSubscription ? (
            <Button variant="outline" onClick={onManageSubscription}>
              Manage subscription
            </Button>
          ) : (
            <form action={customerPortalAction}>
              <Button type="submit" variant="outline">
                Manage subscription
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
