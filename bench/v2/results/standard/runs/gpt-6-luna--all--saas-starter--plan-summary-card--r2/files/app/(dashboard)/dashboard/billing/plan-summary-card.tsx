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
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardDescription>Current plan</CardDescription>
          <CardTitle className="text-xl">{planName}</CardTitle>
        </div>
        <span className="inline-flex items-center rounded-full border border-chart-2/20 bg-chart-2/10 px-2.5 py-1 text-xs font-medium text-chart-2">
          Active
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-card-foreground">
            {monthlyPrice}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              / month
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-1 border-t border-border pt-4">
          <p className="text-sm font-medium text-card-foreground">Next renewal</p>
          <p className="text-sm text-muted-foreground">{renewalDate}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onManageSubscription}>
          Manage subscription
        </Button>
      </CardFooter>
    </Card>
  )
}
