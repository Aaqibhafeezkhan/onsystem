'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Loader2 } from 'lucide-react';

interface DangerZoneCardProps {
  onDelete?: () => void;
  action?: (formData: FormData) => void | Promise<void>;
  isPending?: boolean;
  className?: string;
}

export function DangerZoneCard({
  onDelete,
  action,
  isPending = false,
  className,
}: DangerZoneCardProps) {
  const content = (
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4">
        This removes every member and all data. This action cannot be undone.
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
    </CardContent>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
      </CardHeader>
      {action ? <form action={action}>{content}</form> : content}
    </Card>
  );
}

export default DangerZoneCard;
