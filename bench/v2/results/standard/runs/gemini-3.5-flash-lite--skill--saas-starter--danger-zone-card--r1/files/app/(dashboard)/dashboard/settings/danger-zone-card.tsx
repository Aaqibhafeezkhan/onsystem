'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Trash2, Loader2 } from 'lucide-react';

type DangerZoneCardProps = {
  onDelete?: () => void;
  isPending?: boolean;
};

export function DangerZoneCard({ onDelete, isPending }: DangerZoneCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
        <CardDescription>
          This action removes every member and all data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
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
    </Card>
  );
}
