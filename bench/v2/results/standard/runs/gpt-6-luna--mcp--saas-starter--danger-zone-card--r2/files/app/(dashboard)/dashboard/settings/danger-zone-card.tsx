import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function DangerZoneCard() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-destructive">Delete team</h2>
          <p className="text-sm text-muted-foreground">
            This permanently removes every team member and all team data.
          </p>
        </div>
        <Button variant="destructive" type="button">
          Delete team
        </Button>
      </CardContent>
    </Card>
  )
}
