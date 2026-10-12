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
  /** Formatted monthly amount, including its currency (for example, "$10"). */
  monthlyPrice: string;
  /** Formatted renewal date (for example, "July 1, 2026"). */
  nextRenewalDate: string;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>
          <h2>Current plan</h2>
        </CardTitle>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-chart-2/10 px-2.5 py-1 text-xs font-medium text-chart-2">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-chart-2"
          />
          Active
        </span>
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
        <form action={customerPortalAction} className="w-full sm:w-auto">
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Manage subscription
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
