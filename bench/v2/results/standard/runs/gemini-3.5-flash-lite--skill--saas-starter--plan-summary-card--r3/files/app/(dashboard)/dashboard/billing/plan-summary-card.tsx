'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { customerPortalAction } from '@/lib/payments/actions';

export interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string;
  renewalDate?: string;
  onManageSubscription?: () => void;
}

export function PlanSummaryCard({
  planName = 'Base',
  monthlyPrice = '$12 / month',
  renewalDate = 'Next renewal',
  onManageSubscription,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Plan Summary</CardTitle>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Active
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">{planName}</h3>
            <p className="text-sm text-muted-foreground">
              Monthly price: <span className="font-medium text-foreground">{monthlyPrice}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Next renewal date: <span className="font-medium text-foreground">{renewalDate}</span>
            </p>
          </div>
          {onManageSubscription ? (
            <Button type="button" variant="outline" onClick={onManageSubscription}>
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
