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
  /** A formatted monthly amount, such as "$29". */
  monthlyPrice: string;
  nextRenewalDate: string | Date;
};

function formatRenewalDate(date: string | Date) {
  if (typeof date === 'string') return date;

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Current plan</p>
          <CardTitle className="text-xl">{planName}</CardTitle>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-green-600" />
          Active
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-10">
            <div>
              <p className="text-sm text-muted-foreground">Monthly price</p>
              <p className="mt-1 text-lg font-semibold">
                {monthlyPrice}<span className="text-sm font-normal text-muted-foreground"> / month</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next renewal</p>
              <p className="mt-1 font-medium">{formatRenewalDate(nextRenewalDate)}</p>
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
