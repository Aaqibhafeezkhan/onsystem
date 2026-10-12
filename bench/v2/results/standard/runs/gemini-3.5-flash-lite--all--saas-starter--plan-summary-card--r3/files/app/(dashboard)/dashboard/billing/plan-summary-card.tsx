'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string;
  renewalDate?: string;
  onManageSubscription?: () => void;
}

export function PlanSummaryCard({
  planName = 'Pro Plan',
  monthlyPrice = '$29/month',
  renewalDate = 'Next renewal on Nov 1, 2025',
  onManageSubscription,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle>{planName}</CardTitle>
            <span className="inline-flex items-center rounded-full bg-chart-2/10 px-2 py-0.5 text-xs font-medium text-chart-2">
              Active
            </span>
          </div>
          <CardDescription>{renewalDate}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{monthlyPrice}</div>
      </CardContent>
      <CardFooter>
        <Button onClick={onManageSubscription} variant="outline">
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  );
}
