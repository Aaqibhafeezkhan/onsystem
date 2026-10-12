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

export type PlanSummaryCardProps = {
  planName: string
  monthlyPrice: string
  renewalDate: string
  onManageSubscription?: () => void
}

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
        <CardDescription>Renews on {renewalDate}</CardDescription>
        <CardAction>
          <span className="inline-flex items-center rounded-md border border-chart-2/30 bg-chart-2/10 px-2 py-0.5 text-xs font-medium text-chart-2">
            Active
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-card-foreground">
          {monthlyPrice}
          <span className="text-sm font-normal text-muted-foreground"> / month</span>
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={onManageSubscription}>
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  )
}
