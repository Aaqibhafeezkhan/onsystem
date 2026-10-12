import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';

type PlanSummaryCardProps = {
  planName: string;
  monthlyPrice: string;
  nextRenewalDate: string;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex grid-cols-1 flex-row items-center justify-between gap-3">
        <CardTitle>Current plan</CardTitle>
        <span className="inline-flex items-center rounded-full bg-chart-2/10 px-2.5 py-1 text-xs font-medium text-chart-2">
          Active
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="mt-1 font-medium">{planName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly price</p>
              <p className="mt-1 font-medium">{monthlyPrice} / month</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next renewal</p>
              <p className="mt-1 font-medium">{nextRenewalDate}</p>
            </div>
          </div>
          <form action={customerPortalAction}>
            <Button type="submit" variant="outline">
              Manage subscription
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
