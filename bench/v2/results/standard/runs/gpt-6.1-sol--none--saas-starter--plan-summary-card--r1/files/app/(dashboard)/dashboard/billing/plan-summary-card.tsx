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
  /** Formatted currency amount, for example "$20". */
  monthlyPrice: string;
  /** Formatted renewal date, for example "January 15, 2026". */
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Current plan</CardTitle>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-green-500"
            />
            Active
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xl font-semibold">{planName}</p>
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
            <dt className="text-sm text-muted-foreground">Next renewal date</dt>
            <dd className="font-medium">{nextRenewalDate}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="border-t border-border">
        <form action={customerPortalAction}>
          <Button type="submit" variant="outline">
            Manage subscription
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
