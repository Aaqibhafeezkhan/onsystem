import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';

type PlanSummaryCardProps = {
  planName: string;
  /** Formatted monthly amount, including the currency symbol. */
  monthlyPrice: string;
  /** Formatted date of the next renewal. */
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Current plan</CardTitle>
          <span className="rounded-md bg-chart-2/10 px-2 py-1 text-xs font-medium text-chart-2">
            Active
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-semibold">{planName}</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Monthly price</dt>
            <dd className="font-medium">
              {monthlyPrice}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}/ month
              </span>
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Next renewal</dt>
            <dd className="font-medium">{nextRenewalDate}</dd>
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
