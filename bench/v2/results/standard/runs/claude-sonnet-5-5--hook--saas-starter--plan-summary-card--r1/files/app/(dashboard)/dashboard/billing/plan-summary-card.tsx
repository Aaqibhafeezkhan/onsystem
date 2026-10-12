import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

type PlanSummaryCardProps = {
  planName: string;
  monthlyPrice: string;
  renewalDate: string;
  onManageSubscription?: () => void;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  renewalDate,
  onManageSubscription
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{planName}</CardTitle>
        <CardDescription>Current plan</CardDescription>
        <CardAction>
          <span className="inline-flex items-center rounded-full bg-chart-2/15 px-2 py-0.5 text-xs font-medium text-chart-2">
            Active
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold">
          {monthlyPrice}
          <span className="text-muted-foreground text-sm font-normal">
            {' '}
            / month
          </span>
        </p>
        <p className="text-muted-foreground text-sm">
          Next renewal: {renewalDate}
        </p>
      </CardContent>
      <CardFooter>
        <Button type="button" onClick={onManageSubscription}>
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  );
}
