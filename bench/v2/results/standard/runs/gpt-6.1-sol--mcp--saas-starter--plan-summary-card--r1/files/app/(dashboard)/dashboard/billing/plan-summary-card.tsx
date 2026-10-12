import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';

export type PlanSummaryCardProps = {
  planName: string;
  /** Formatted monthly amount, including the currency (for example, "$20"). */
  monthlyPrice: string;
  /** Formatted renewal date for display in the customer's locale. */
  nextRenewalDate: string;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm text-muted-foreground">Current plan</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{planName}</CardTitle>
          <span className="inline-flex items-center gap-1 rounded-md bg-chart-2/10 px-2 py-1 text-xs font-medium text-chart-2">
            <span aria-hidden="true" className="size-2 rounded-sm bg-chart-2" />
            Active
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Monthly price</dt>
            <dd className="text-2xl font-semibold">
              {monthlyPrice}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}/ month
              </span>
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Next renewal date</dt>
            <dd className="text-sm font-medium">{nextRenewalDate}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter>
        <form action={customerPortalAction}>
          <Button type="submit" variant="outline">
            Manage subscription
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
