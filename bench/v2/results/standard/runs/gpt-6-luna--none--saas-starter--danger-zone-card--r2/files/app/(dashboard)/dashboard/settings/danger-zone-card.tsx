import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export function DangerZoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground text-sm">
          Deleting this team removes every member and all team data. This action
          cannot be undone.
        </p>
        <Button type="button" variant="destructive">
          Delete team
        </Button>
      </CardContent>
    </Card>
  );
}
