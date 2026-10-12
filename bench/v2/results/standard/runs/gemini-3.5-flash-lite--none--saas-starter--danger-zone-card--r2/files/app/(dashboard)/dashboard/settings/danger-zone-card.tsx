import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Trash2, Loader2 } from 'lucide-react';
import React from 'react';

interface DangerZoneCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  onDelete?: () => void;
  isPending?: boolean;
}

export function DangerZoneCard({
  onDelete,
  isPending,
  ...props
}: DangerZoneCardProps) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className="text-red-600">Delete team</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This removes every member and all data.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="bg-red-600 hover:bg-red-700"
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
    </Card>
  );
}

export default DangerZoneCard;
