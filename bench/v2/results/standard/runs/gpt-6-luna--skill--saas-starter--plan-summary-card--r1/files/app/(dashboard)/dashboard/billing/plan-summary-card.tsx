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
  monthlyPrice: string;
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
        <CardTitle>Current plan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold">{planName}</h2>
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                Active
              </span>
            </div>
            <dl className="flex flex-col gap-3 text-sm sm:flex-row sm:gap-8">
              <div>
                <dt className="text-muted-foreground">Monthly price</dt>
                <dd className="mt-1 font-medium">{monthlyPrice}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Next renewal</dt>
                <dd className="mt-1 font-medium">{nextRenewalDate}</dd>
              </div>
            </dl>
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
