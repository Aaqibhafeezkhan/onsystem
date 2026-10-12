'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';

interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string;
  renewalDate?: string;
  onManageSubscription?: () => void;
}

export function PlanSummaryCard({
  planName = 'Base',
  monthlyPrice = '$12/month',
  renewalDate = 'November 1, 2024',
  onManageSubscription
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold">Plan Summary</CardTitle>
          <CardDescription>Manage your active subscription plan</CardDescription>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Active
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Current Plan</span>
          <span className="font-medium text-foreground">{planName}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Monthly Price</span>
          <span className="font-medium text-foreground">{monthlyPrice}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground">Next Renewal Date</span>
          <span className="font-medium text-foreground">{renewalDate}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-2">
        {onManageSubscription ? (
          <Button variant="outline" onClick={onManageSubscription}>
            Manage subscription
          </Button>
        ) : (
          <form action={customerPortalAction}>
            <Button variant="outline" type="submit">
              Manage subscription
            </Button>
          </form>
        )}
      </CardFooter>
    </Card>
  );
}
