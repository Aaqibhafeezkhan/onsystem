import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
        <div className="flex items-center justify-between">
          <CardTitle>{planName}</CardTitle>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            Active
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold">
          {monthlyPrice}
          <span className="text-sm font-normal text-muted-foreground">
            {' '}
            / month
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Next renewal: {renewalDate}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          onClick={onManage}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  );
}
