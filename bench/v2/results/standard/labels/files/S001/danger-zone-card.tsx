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
        <CardTitle className="text-destructive">
          <h2>Delete team</h2>
        </CardTitle>
        <CardDescription>
          Deleting this team permanently removes every member and all team data.
          This action cannot be undone.
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
