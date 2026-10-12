import { Trash2 } from 'lucide-react';
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
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Deleting this team permanently removes every member and all team data.
          This action cannot be undone.
        </p>
        <Button type="button" variant="destructive">
          <Trash2 aria-hidden="true" />
          Delete team
        </Button>
      </CardContent>
    </Card>
  );
}
