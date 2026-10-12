import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PlanSummaryCardProps = {
  planName?: string;
  monthlyPrice?: number;
  currency?: string;
  renewalDate?: Date;
  onManageSubscription?: () => void;
};

export function PlanSummaryCard({
  planName = "Pro",
  monthlyPrice = 20,
  currency = "USD",
  renewalDate = new Date(),
  onManageSubscription,
}: PlanSummaryCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(monthlyPrice);

  const formattedRenewal = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(renewalDate);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">{planName} plan</CardTitle>
          <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
            Active
          </span>
        </div>
        <CardDescription>
          {formattedPrice} per month · Renews on {formattedRenewal}
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onManageSubscription}
          >
            Manage subscription
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold">{formattedPrice}</span>
          <span className="text-muted-foreground text-sm">/ month</span>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Next renewal: {formattedRenewal}
        </p>
      </CardContent>
    </Card>
  );
}
