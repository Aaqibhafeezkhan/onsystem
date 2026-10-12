'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Loader2, Trash2 } from 'lucide-react';

interface DangerZoneCardProps {
  action?: (formData: FormData) => void | Promise<void>;
  onDelete?: () => void;
  isPending?: boolean;
  className?: string;
}

export function DangerZoneCard({
  action,
  onDelete,
  isPending = false,
  className
}: DangerZoneCardProps) {
  const buttonContent = (
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
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
        <CardDescription>
          This action cannot be undone. This removes every member and all data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {action ? (
          <form action={action}>{buttonContent}</form>
        ) : (
          buttonContent
        )}
      </CardContent>
    </Card>
  );
}
