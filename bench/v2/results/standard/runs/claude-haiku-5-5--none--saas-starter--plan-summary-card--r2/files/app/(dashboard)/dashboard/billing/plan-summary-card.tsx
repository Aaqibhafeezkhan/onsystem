import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

type PlanSummaryCardProps = {
  planName: string;
  monthlyPrice: string;
  nextRenewalDate: string;
  onManageSubscription?: () => void;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate,
  onManageSubscription
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Current plan</CardTitle>
        <CardDescription>Your subscription details</CardDescription>
        <CardAction>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">
            <span className="size-1.5 rounded-full bg-green-500" aria-hidden="true" />
            Active
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-sm">Plan</dt>
            <dd className="font-semibold">{planName}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-sm">Monthly price</dt>
            <dd className="font-semibold">{monthlyPrice}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-sm">Next renewal</dt>
            <dd className="font-semibold">{nextRenewalDate}</dd>
          </div>
        </dl>
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={onManageSubscription}
          >
            Manage subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
