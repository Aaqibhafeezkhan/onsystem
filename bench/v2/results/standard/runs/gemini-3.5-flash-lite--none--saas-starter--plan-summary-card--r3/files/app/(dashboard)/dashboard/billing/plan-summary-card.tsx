import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { customerPortalAction } from '@/lib/payments/actions';

interface PlanSummaryCardProps {
  planName?: string;
  monthlyPrice?: string;
  renewalDate?: string;
  onManageSubscription?: () => void;
}

export function PlanSummaryCard({
  planName = 'Pro',
  monthlyPrice = '$12/month',
  renewalDate = 'December 1, 2025',
  onManageSubscription,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Summary</CardTitle>
        <CardDescription>
          View details about your current subscription plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-lg">{planName}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                Active
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{monthlyPrice}</p>
            <p className="text-sm text-muted-foreground">
              Next renewal date: {renewalDate}
            </p>
          </div>
          {onManageSubscription ? (
            <Button
              type="button"
              variant="outline"
              onClick={onManageSubscription}
            >
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
