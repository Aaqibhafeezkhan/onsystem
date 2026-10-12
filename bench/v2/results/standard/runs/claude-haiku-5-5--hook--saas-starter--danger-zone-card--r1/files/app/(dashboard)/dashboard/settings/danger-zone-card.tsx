import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export function DangerZoneCard() {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
        <CardDescription>
          Deleting this team will permanently remove every member and all of
          its data. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end">
        <Button variant="destructive" type="button">
          Delete team
        </Button>
      </CardContent>
    </Card>
  );
}
