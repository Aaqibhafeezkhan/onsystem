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

export interface PlanSummaryCardProps {
  planName: string
  /** Monthly price in the smallest display unit, e.g. 29 for $29.00 */
  monthlyPrice: number
  currency?: string
  renewalDate: Date
  onManageSubscription?: () => void
}

export function PlanSummaryCard({
  planName,
  monthlyPrice,
  currency = "USD",
  renewalDate,
  onManageSubscription,
}: PlanSummaryCardProps) {
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(monthlyPrice)

  const renewal = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(renewalDate)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{planName}</CardTitle>
        <CardDescription>Your current plan</CardDescription>
        <CardAction>
          <span className="rounded-md bg-chart-2/15 px-2 py-0.5 text-xs font-medium text-chart-2">
            Active
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-2xl font-semibold text-card-foreground">
          {price}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / month
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          Next renewal: <time dateTime={renewalDate.toISOString()}>{renewal}</time>
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
