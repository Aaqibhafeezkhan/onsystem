import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PlanSummaryCardProps = {
  planName: string;
  monthlyPrice: string;
  renewalDate: string;
};

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  renewalDate,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardDescription>Current plan</CardDescription>
        <span className="row-span-2 rounded-full bg-chart-2/10 px-2.5 py-1 text-xs font-medium text-chart-2">
          Active
        </span>
        <CardTitle className="text-xl">{planName}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Monthly price</p>
          <p className="mt-1 text-lg font-semibold">
            {monthlyPrice}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}/ month
            </span>
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Next renewal</p>
          <p className="mt-1 text-lg font-semibold">{renewalDate}</p>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <Button type="button">Manage subscription</Button>
      </CardFooter>
    </Card>
  );
}
