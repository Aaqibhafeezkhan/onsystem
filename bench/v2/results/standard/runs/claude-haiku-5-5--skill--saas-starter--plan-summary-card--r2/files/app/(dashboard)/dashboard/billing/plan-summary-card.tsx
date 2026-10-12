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
  monthlyPrice: number;
  renewalDate: Date;
  onManageSubscription?: () => void;
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  renewalDate,
  onManageSubscription
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {planName}
          <span className="bg-chart-2/15 text-chart-2 rounded-md px-2 py-0.5 text-xs font-medium">
            Active
          </span>
        </CardTitle>
        <CardDescription>Your current subscription plan</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onManageSubscription}>
            Manage subscription
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-2xl font-semibold">
          {priceFormatter.format(monthlyPrice)}
          <span className="text-muted-foreground text-sm font-normal">
            {" "}/ month
          </span>
        </p>
        <p className="text-muted-foreground text-sm">
          Next renewal: {dateFormatter.format(renewalDate)}
        </p>
      </CardContent>
    </Card>
  );
}
