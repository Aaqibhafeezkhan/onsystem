import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type PlanSummaryCardProps = {
  planName: string;
  /** The plan's monthly price, including its currency symbol (for example, "$12"). */
  monthlyPrice: string;
  nextRenewalDate: Date | string;
  manageSubscriptionHref?: string;
};

function formatRenewalDate(date: Date | string) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return String(date);

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate,
  manageSubscriptionHref,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-lg">{planName}</CardTitle>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            <span aria-hidden="true">🟢</span>
            Active
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-2xl font-semibold text-foreground">{monthlyPrice}</span>{' '}
          / month
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Next renewal</p>
          <p className="mt-1 font-medium">{formatRenewalDate(nextRenewalDate)}</p>
        </div>
        {manageSubscriptionHref ? (
          <Button asChild variant="outline">
            <a href={manageSubscriptionHref}>Manage subscription</a>
          </Button>
        ) : (
          <Button type="button" variant="outline">
            Manage subscription
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
