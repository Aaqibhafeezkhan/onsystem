'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string;
  renewalDate?: string;
  onManageSubscription?: () => void;
}

export function PlanSummaryCard({
  planName = 'Pro Plan',
  monthlyPrice = '$29/month',
  renewalDate = 'November 1, 2025',
  onManageSubscription,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Plan Summary</CardTitle>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-chart-2/10 text-chart-2">
            Active
          </span>
        </div>
        <CardDescription>
          Review your current plan details and billing schedule.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Current Plan
            </span>
            <span className="text-sm font-semibold">{planName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Monthly Price
            </span>
            <span className="text-sm font-semibold">{monthlyPrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Next Renewal Date
            </span>
            <span className="text-sm font-semibold">{renewalDate}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          onClick={onManageSubscription}
          className="w-full sm:w-auto"
        >
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  );
}
