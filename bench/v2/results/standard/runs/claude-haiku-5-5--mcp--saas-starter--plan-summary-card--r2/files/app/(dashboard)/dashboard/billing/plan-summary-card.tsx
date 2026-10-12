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
  planName: string;
  monthlyPrice: string;
  renewalDate: string;
  onManageSubscription?: () => void;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  renewalDate,
  onManageSubscription,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{planName}</CardTitle>
        <CardDescription>Current plan</CardDescription>
        <CardAction>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-green-500" />
            Active
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-2xl font-semibold text-card-foreground">{monthlyPrice}</p>
          <p className="text-sm text-muted-foreground">per month</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Next renewal: <span className="font-medium text-card-foreground">{renewalDate}</span>
        </p>
        <div>
          <Button type="button" variant="outline" onClick={onManageSubscription}>
            Manage subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
