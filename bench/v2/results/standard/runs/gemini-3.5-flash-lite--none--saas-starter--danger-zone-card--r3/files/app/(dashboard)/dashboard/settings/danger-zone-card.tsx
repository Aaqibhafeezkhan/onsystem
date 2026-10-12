import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

export function DangerZoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This action cannot be undone. This removes every member and all data associated with the team.
        </p>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete team
        </Button>
      </CardContent>
    </Card>
  );
}
