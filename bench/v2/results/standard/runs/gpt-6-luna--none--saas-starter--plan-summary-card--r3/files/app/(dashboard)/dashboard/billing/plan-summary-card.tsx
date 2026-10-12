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
  monthlyPrice: string;
  nextRenewalDate: string;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Current plan</CardTitle>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-green-600 dark:bg-green-400" />
          Active
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-5 sm:grid-cols-3 sm:gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="mt-1 font-semibold">{planName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly price</p>
              <p className="mt-1 font-semibold">{monthlyPrice}<span className="font-normal text-muted-foreground"> / month</span></p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next renewal</p>
              <p className="mt-1 font-semibold">{nextRenewalDate}</p>
            </div>
          </div>
          <form action={customerPortalAction}>
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              Manage subscription
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
