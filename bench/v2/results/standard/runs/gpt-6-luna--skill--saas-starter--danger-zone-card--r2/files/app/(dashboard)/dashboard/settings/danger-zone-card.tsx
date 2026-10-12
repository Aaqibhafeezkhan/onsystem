import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DangerZoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Deleting this team permanently removes every member and all data. This
          action cannot be undone.
        </p>
        <Button type="button" variant="destructive">
          Delete team
        </Button>
      </CardContent>
    </Card>
  );
}
