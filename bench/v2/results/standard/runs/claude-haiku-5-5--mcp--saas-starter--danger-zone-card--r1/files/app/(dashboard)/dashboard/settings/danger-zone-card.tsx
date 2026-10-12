import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DangerZoneCard() {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
        <CardDescription>
          Deleting this team removes every member and all of its data. This
          action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="destructive">Delete team</Button>
      </CardFooter>
    </Card>
  );
}
