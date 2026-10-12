'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Loader2 } from 'lucide-react';

interface DangerZoneCardProps {
  onDelete?: () => void;
  action?: (formData: FormData) => void;
  isPending?: boolean;
}

export function DangerZoneCard({
  onDelete,
  action,
  isPending = false
}: DangerZoneCardProps) {
  const content = (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        Removing the team will remove every member and all data. This action cannot be undone.
      </p>
      <Button
        type={action ? 'submit' : 'button'}
        variant="destructive"
        onClick={onDelete}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete team
          </>
        )}
      </Button>
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
      </CardHeader>
      <CardContent>
        {action ? (
          <form action={action}>{content}</form>
        ) : (
          content
        )}
      </CardContent>
    </Card>
  );
}

export default DangerZoneCard;
