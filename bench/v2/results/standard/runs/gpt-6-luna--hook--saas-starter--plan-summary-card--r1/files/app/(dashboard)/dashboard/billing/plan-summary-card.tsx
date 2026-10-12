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
  /** Monthly amount in major currency units (for example, 12.5 for $12.50). */
  monthlyPrice: number;
  nextRenewalDate: Date | string;
  currency?: string;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate,
  currency = 'USD'
}: PlanSummaryCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(monthlyPrice);
  const formattedRenewalDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(nextRenewalDate));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current plan</p>
            <CardTitle className="text-xl">{planName}</CardTitle>
          </div>
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            Active
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Monthly price</p>
              <p className="mt-1 text-lg font-semibold">
                {formattedPrice} <span className="text-sm font-normal text-muted-foreground">/ month</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next renewal</p>
              <p className="mt-1 font-medium">{formattedRenewalDate}</p>
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
