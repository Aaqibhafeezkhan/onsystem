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
  monthlyPrice: number;
  renewalDate: Date;
  currency?: string;
  onManageSubscription?: () => void;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  renewalDate,
  currency = 'USD',
  onManageSubscription
}: PlanSummaryCardProps) {
  const price = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(monthlyPrice);

  const renewal = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(renewalDate);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{planName}</CardTitle>
          <span className="inline-flex items-center rounded-full bg-chart-2/10 px-2 py-0.5 text-xs font-medium text-chart-2">
            Active
          </span>
        </div>
        <CardDescription>
          {price} per month · Renews on {renewal}
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onManageSubscription}>
            Manage subscription
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Monthly price</dt>
            <dd className="font-medium">{price}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Next renewal</dt>
            <dd className="font-medium">{renewal}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
