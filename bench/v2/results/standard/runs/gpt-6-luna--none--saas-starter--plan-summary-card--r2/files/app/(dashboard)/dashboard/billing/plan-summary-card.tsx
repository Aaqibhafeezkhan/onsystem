import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { customerPortalAction } from '@/lib/payments/actions';

type PlanSummaryCardProps = {
  planName: string;
  /** Monthly amount in cents. */
  monthlyPrice: number;
  nextRenewalDate: Date | string;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate
}: PlanSummaryCardProps) {
  const renewalDate = new Date(nextRenewalDate);
  const formattedRenewalDate = Number.isNaN(renewalDate.getTime())
    ? String(nextRenewalDate)
    : new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).format(renewalDate);

  return (
    <Card>
      <CardHeader className="flex grid-cols-1 flex-row items-center justify-between gap-4">
        <CardTitle>Current plan</CardTitle>
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
          Active
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-semibold text-foreground">{planName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ${((monthlyPrice || 0) / 100).toFixed(2)} / month
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
