import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function DangerZoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
        <CardDescription>
          Deleting this team removes every member and permanently deletes all team data.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end">
        <Button variant="destructive" type="button">
          Delete team
        </Button>
      </CardContent>
    </Card>
  )
}
