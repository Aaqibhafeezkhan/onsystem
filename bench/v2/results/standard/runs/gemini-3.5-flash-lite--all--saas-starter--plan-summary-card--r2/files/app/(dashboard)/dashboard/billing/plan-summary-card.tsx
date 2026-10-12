import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PlanSummaryCardProps {
  planName?: string;
  price?: string;
  renewalDate?: string;
  onManageSubscription?: () => void;
}

export function PlanSummaryCard({
  planName = 'Pro Plan',
  price = '$29/month',
  renewalDate = 'November 1, 2025',
  onManageSubscription,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{planName}</CardTitle>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-chart-2/10 text-chart-2">
            Active
          </span>
        </div>
        <CardDescription>Current subscription plan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold">{price}</div>
          <div className="text-sm text-muted-foreground">
            Next renewal date: {renewalDate}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={onManageSubscription}>
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  );
}
