import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';

type PlanSummaryCardProps = {
  planName: string;
  /** Formatted monthly amount, including its currency (for example, "$20"). */
  monthlyPrice: string;
  /** Formatted renewal date for display. */
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
        <CardDescription>Current plan</CardDescription>
        <CardTitle>{planName}</CardTitle>
        <CardAction>
          <span className="inline-flex items-center rounded-md bg-chart-2/10 px-2 py-1 text-xs font-medium text-chart-2">
            Active
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Monthly price</dt>
            <dd className="text-xl font-semibold">
              {monthlyPrice}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}/ month
              </span>
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Next renewal date</dt>
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
