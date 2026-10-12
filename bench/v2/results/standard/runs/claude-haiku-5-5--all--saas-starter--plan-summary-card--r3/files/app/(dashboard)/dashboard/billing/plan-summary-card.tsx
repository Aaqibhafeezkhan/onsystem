import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type PlanSummaryCardProps = {
  planName: string;
  /** Monthly price in the given currency, in major units (e.g. 19 for $19). */
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
  onManageSubscription,
}: PlanSummaryCardProps) {
  const price = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(monthlyPrice);

  const renewal = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(renewalDate);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{planName}</CardTitle>
          <span className="inline-flex items-center rounded-md bg-chart-2 px-2 py-0.5 text-xs font-medium text-primary-foreground">
            Active
          </span>
        </div>
        <CardDescription>Your current plan</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-2xl font-semibold text-card-foreground">
          {price}
          <span className="text-sm font-normal text-muted-foreground"> / month</span>
        </p>
        <p className="text-sm text-muted-foreground">Renews on {renewal}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={onManageSubscription}>
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  );
}
