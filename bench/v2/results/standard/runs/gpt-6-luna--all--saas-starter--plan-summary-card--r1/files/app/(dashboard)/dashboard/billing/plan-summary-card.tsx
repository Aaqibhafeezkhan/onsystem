import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type PlanSummaryCardProps = {
  planName: string;
  /** Monthly price in the smallest currency unit (for example, cents). */
  monthlyPrice: number;
  nextRenewalDate: Date | string;
  manageSubscriptionHref: string;
  currency?: string;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate,
  manageSubscriptionHref,
  currency = 'USD',
}: PlanSummaryCardProps) {
  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(monthlyPrice / 100);
  const formattedRenewalDate = new Date(nextRenewalDate).toLocaleDateString(
    undefined,
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Current plan</p>
          <CardTitle className="mt-1">{planName}</CardTitle>
        </div>
        <span className="inline-flex items-center rounded-full bg-chart-2/10 px-2.5 py-1 text-xs font-medium text-chart-2">
          Active
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <dl className="grid flex-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Monthly price</dt>
            <dd className="mt-1 text-xl font-semibold text-card-foreground">
              {formattedPrice}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / month
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Next renewal</dt>
            <dd className="mt-1 font-medium text-card-foreground">
              {formattedRenewalDate}
            </dd>
          </div>
        </dl>
        <Button asChild>
          <Link href={manageSubscriptionHref}>Manage subscription</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
