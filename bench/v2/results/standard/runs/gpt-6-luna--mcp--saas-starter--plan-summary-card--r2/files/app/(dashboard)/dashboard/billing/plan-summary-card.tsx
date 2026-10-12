import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
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
        <CardTitle className="text-lg font-semibold">Current plan</CardTitle>
        <span className="inline-flex items-center gap-2 rounded-md bg-chart-2/10 px-2 py-1 text-xs font-medium text-chart-2">
          <span aria-hidden="true" className="size-2 rounded-xs bg-chart-2" />
          Active
        </span>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-2xl font-semibold text-card-foreground">{planName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-card-foreground">{monthlyPrice}</span>{' '}
            per month
          </p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">Next renewal</p>
          <p className="mt-1 text-sm font-medium text-card-foreground">
            {nextRenewalDate}
          </p>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border">
        <form action={customerPortalAction} className="w-full">
          <Button type="submit" variant="outline" className="w-full">
            Manage subscription
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
