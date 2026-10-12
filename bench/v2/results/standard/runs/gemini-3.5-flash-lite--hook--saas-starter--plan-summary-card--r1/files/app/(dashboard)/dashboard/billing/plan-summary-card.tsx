import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { customerPortalAction } from '@/lib/payments/actions';

interface PlanSummaryCardProps {
  planName?: string;
  price?: string;
  renewalDate?: string;
}

export function PlanSummaryCard({
  planName = 'Base',
  price = '$12 / month',
  renewalDate = 'Next renewal on December 1, 2024',
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Plan</CardTitle>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            <span className="size-1.5 rounded-full bg-primary"></span>
            Active
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xl font-semibold text-foreground">
          {planName}
        </div>
        <div className="text-sm text-muted-foreground">{price}</div>
        <div className="text-sm text-muted-foreground">{renewalDate}</div>
      </CardContent>
      <CardFooter className="border-t">
        <form action={customerPortalAction} className="w-full sm:w-auto">
          <Button type="submit" variant="outline">
            Manage subscription
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
