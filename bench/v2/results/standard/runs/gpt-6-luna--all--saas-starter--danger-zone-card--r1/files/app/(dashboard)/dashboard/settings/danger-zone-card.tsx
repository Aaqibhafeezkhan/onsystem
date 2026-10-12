import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export function DangerZoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
        <CardDescription>
          This permanently removes every team member and all team data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive">Delete team</Button>
      </CardContent>
    </Card>
  );
}
