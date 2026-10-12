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
  onManage?: () => void
}

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  renewalDate,
  onManage,
}: PlanSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Current plan</CardDescription>
        <CardTitle>{planName}</CardTitle>
        <CardAction>
          <span className="rounded-md bg-chart-2/10 px-2 py-1 text-xs font-medium text-chart-2">
            Active
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-2xl font-semibold">
          {monthlyPrice}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / month
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Renews on {renewalDate}
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={onManage}>Manage subscription</Button>
      </CardFooter>
    </Card>
  )
}
