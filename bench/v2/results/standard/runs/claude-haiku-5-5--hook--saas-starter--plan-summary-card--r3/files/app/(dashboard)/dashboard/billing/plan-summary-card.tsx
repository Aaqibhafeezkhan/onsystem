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
  /** Monthly price in the major currency unit, e.g. 29 for $29.00 */
  monthlyPrice: number;
  /** Next renewal date */
  renewalDate: Date | string;
  currency?: string;
  locale?: string;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  renewalDate,
  currency = 'USD',
  locale = 'en-US'
}: PlanSummaryCardProps) {
  const price = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(monthlyPrice);

  const renewal = new Date(renewalDate).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {planName}
          <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
            Active
          </span>
        </CardTitle>
        <CardDescription>Your current subscription plan</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            Manage subscription
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Monthly price</p>
          <p className="text-2xl font-semibold">
            {price}
            <span className="text-muted-foreground text-sm font-normal">
              {' '}/ month
            </span>
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Next renewal</p>
          <p className="font-medium">{renewal}</p>
        </div>
      </CardContent>
    </Card>
  );
}
