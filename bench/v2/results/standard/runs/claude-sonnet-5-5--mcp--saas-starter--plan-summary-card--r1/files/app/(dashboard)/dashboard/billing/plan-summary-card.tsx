import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PlanSummaryCardProps {
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
        <CardTitle>{planName}</CardTitle>
        <CardDescription>Current plan</CardDescription>
        <CardAction>
          <span className="rounded-md bg-chart-2/15 px-2 py-1 text-xs font-medium text-chart-2">
            Active
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">
          {monthlyPrice}
          <span className="text-sm font-normal text-muted-foreground">
            /month
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Next renewal: {renewalDate}
        </p>
      </CardContent>
      <CardFooter>
        <Button>Manage subscription</Button>
      </CardFooter>
    </Card>
  )
}
