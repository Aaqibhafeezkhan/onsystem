'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { customerPortalAction } from '@/lib/payments/actions';

interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string | number;
  renewalDate?: string;
}

export function PlanSummaryCard({
  planName = 'Base',
  monthlyPrice = '$8/month',
  renewalDate = 'N/A'
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-medium">Subscription Plan</CardTitle>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Active
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-2xl font-semibold mt-1">{planName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Price</p>
              <p className="font-medium mt-1">{monthlyPrice}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Renewal Date</p>
              <p className="font-medium mt-1">{renewalDate}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <form action={customerPortalAction} className="w-full">
          <Button type="submit" variant="outline">
            Manage subscription
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
