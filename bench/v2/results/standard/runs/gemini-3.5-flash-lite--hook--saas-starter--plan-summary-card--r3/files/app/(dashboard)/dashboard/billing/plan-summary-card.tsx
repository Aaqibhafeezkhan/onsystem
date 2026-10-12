import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { customerPortalAction } from '@/lib/payments/actions';

interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string;
  renewalDate?: string;
}

export function PlanSummaryCard({
  planName = 'Base',
  monthlyPrice = '$10/month',
  renewalDate = 'N/A',
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{planName}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-chart-2/10 text-chart-2">
                Active
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Monthly price: {monthlyPrice}
            </p>
            <p className="text-sm text-muted-foreground">
              Next renewal date: {renewalDate}
            </p>
          </div>
          <form action={customerPortalAction}>
            <Button type="submit" variant="outline">
              Manage subscription
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export default PlanSummaryCard;
