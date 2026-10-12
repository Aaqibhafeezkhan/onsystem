import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PlanSummaryCardProps = {
  planName?: string;
  monthlyPrice?: string;
  nextRenewalDate?: string;
  onManageSubscription?: () => void;
};

export function PlanSummaryCard({
  planName = "Pro",
  monthlyPrice = "$29",
  nextRenewalDate = "October 24, 2025",
  onManageSubscription,
}: PlanSummaryCardProps) {
  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Current plan</p>
          <CardTitle className="text-2xl">{planName}</CardTitle>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-chart-2/10 px-2.5 py-1 text-xs font-medium text-chart-2">
          <span className="size-1.5 rounded-full bg-chart-2" aria-hidden="true" />
          Active
        </span>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Monthly price</p>
          <p className="text-lg font-semibold">
            {monthlyPrice} <span className="text-sm font-normal text-muted-foreground">/ month</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Next renewal</p>
          <p className="text-lg font-semibold">{nextRenewalDate}</p>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <Button type="button" onClick={onManageSubscription}>
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  );
}
