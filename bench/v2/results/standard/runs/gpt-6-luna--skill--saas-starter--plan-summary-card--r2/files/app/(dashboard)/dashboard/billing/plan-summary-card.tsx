import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';

type PlanSummaryCardProps = {
  planName: string;
  /** Monthly price in major currency units, such as 12.99. */
  monthlyPrice: number;
  nextRenewalDate: Date | string;
  currency?: string;
};

function formatRenewalDate(date: Date | string) {
  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return date.toString();

  return parsedDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate,
  currency = 'USD',
}: PlanSummaryCardProps) {
  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(monthlyPrice);

  return (
    <Card>
      <CardHeader className="flex grid-cols-1 items-center justify-between gap-3 sm:grid-cols-[1fr_auto]">
        <CardTitle>Current plan</CardTitle>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-chart-2/10 px-2.5 py-1 text-xs font-medium text-chart-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" />
          Active
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-lg font-semibold">{planName}</p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly price</p>
                <p className="font-medium">
                  {formattedPrice}
                  <span className="text-sm font-normal text-muted-foreground"> / month</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next renewal</p>
                <p className="font-medium">{formatRenewalDate(nextRenewalDate)}</p>
              </div>
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
