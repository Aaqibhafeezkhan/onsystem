import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DangerZoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
        <CardDescription>
          Deleting your team removes every member and all of its data. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive">Delete team</Button>
      </CardContent>
    </Card>
  );
}
