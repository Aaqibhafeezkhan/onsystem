import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type PlanSummaryCardProps = {
  planName: string;
  monthlyPrice: string;
  nextRenewalDate: string;
  onManageSubscription?: () => void;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate,
  onManageSubscription,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Current plan</CardTitle>
        <span className="rounded-full bg-chart-2/10 px-2.5 py-1 text-xs font-medium text-chart-2">
          Active
        </span>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-2xl font-semibold text-card-foreground">
              {planName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="text-lg font-medium text-card-foreground">
                {monthlyPrice}
              </span>{' '}
              / month
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Next renewal</p>
            <p className="mt-1 font-medium text-card-foreground">
              {nextRenewalDate}
            </p>
          </div>
        </div>
        <Button type="button" onClick={onManageSubscription}>
          Manage subscription
        </Button>
      </CardContent>
    </Card>
  );
}
