'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';
import { TeamDataWithMembers } from '@/lib/db/schema';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string;
  nextRenewalDate?: string;
}

export function PlanSummaryCard({
  planName: propPlanName,
  monthlyPrice: propMonthlyPrice,
  nextRenewalDate: propNextRenewalDate,
}: PlanSummaryCardProps) {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);

  const planName = propPlanName || teamData?.planName || 'Free';
  const monthlyPrice =
    propMonthlyPrice ||
    (planName.toLowerCase().includes('plus')
      ? '$12/month'
      : planName.toLowerCase().includes('base')
      ? '$8/month'
      : '$0/month');
  const nextRenewalDate = propNextRenewalDate || 'N/A';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Plan Summary</CardTitle>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Active
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="font-medium mt-1">{planName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Monthly Price</p>
            <p className="font-medium mt-1">{monthlyPrice}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Next Renewal Date</p>
            <p className="font-medium mt-1">{nextRenewalDate}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-end">
        <form action={customerPortalAction}>
          <Button type="submit" variant="outline">
            Manage Subscription
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
