import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { customerPortalAction } from '@/lib/payments/actions';

interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string;
  nextRenewalDate?: string;
  onManageSubscription?: () => void;
}

export function PlanSummaryCard({
  planName = 'Pro',
  monthlyPrice = '$12/month',
  nextRenewalDate = 'Next renewal on November 1, 2025',
  onManageSubscription,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Plan</CardTitle>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-xl font-semibold text-foreground">{planName}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{monthlyPrice}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {nextRenewalDate}
          </div>
          {onManageSubscription ? (
            <Button type="button" variant="outline" onClick={onManageSubscription}>
              Manage subscription
            </Button>
          ) : (
            <form action={customerPortalAction}>
              <Button type="submit" variant="outline">
                Manage subscription
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
