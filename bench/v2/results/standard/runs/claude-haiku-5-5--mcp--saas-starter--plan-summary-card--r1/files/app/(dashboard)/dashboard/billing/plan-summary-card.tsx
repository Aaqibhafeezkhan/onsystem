import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type PlanSummaryCardProps = {
  planName: string
  monthlyPrice: string
  renewalDate: string
}

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  renewalDate,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Current plan</CardDescription>
        <CardTitle className="flex items-center gap-2">
          {planName}
          <span className="inline-flex items-center rounded-md bg-chart-2/15 px-2 py-0.5 text-xs font-medium text-chart-2">
            Active
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Monthly price</p>
          <p className="text-2xl font-semibold text-card-foreground">
            {monthlyPrice}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Next renewal</p>
          <p className="text-base font-medium text-card-foreground">
            {renewalDate}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  )
}
