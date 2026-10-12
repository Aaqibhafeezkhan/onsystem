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
  onManage?: () => void;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  renewalDate,
  onManage
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{planName}</CardTitle>
        <CardDescription>Current plan</CardDescription>
        <CardAction>
          <span className="text-green-500 text-xs font-medium">Active</span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1">
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
        <Button type="button" variant="outline" onClick={onManage}>
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  );
}
