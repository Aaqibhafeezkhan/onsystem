import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DangerZoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
        <CardDescription>
          Permanently delete this team, remove every member, and erase all team
          data. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="destructive">
          Delete team
        </Button>
      </CardContent>
    </Card>
  );
}
