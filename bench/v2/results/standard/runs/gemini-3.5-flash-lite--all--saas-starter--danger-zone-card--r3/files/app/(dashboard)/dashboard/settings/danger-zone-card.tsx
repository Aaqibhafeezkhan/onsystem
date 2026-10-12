'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DangerZoneCardProps {
  onDelete?: () => void;
  action?: string | ((formData: FormData) => void);
}

export function DangerZoneCard({ onDelete, action }: DangerZoneCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting this team will remove every member and all data associated with it. This action cannot be undone.
        </p>
        {action ? (
          <form action={action}>
            <Button type="submit" variant="destructive">
              Delete team
            </Button>
          </form>
        ) : (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete team
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
