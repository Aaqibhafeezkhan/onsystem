import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

type PlanSummaryCardProps = {
  planName: string;
  /** Monthly price in USD, e.g. 12 for $12.00 / month. */
  monthlyPrice: number;
  nextRenewalDate: Date;
  onManageSubscription?: () => void;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  nextRenewalDate,
  onManageSubscription
}: PlanSummaryCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(monthlyPrice);

  const formattedRenewal = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(nextRenewalDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {planName}
          <span className="inline-flex items-center rounded-full bg-chart-2/10 px-2 py-0.5 text-xs font-medium text-chart-2">
            Active
          </span>
        </CardTitle>
        <CardDescription>Your current subscription plan</CardDescription>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            onClick={onManageSubscription}
          >
            Manage subscription
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground text-sm">Monthly price</span>
          <span className="text-2xl font-semibold">
            {formattedPrice}
            <span className="text-muted-foreground text-sm font-normal">
              {" "}
              / month
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Next renewal</span>
          <span className="text-sm font-medium">{formattedRenewal}</span>
        </div>
      </CardContent>
    </Card>
  );
}
