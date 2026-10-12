'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface DangerZoneCardProps {
  action?: (formData: FormData) => void | Promise<void>;
  isPending?: boolean;
}

export function DangerZoneCard({ action, isPending }: DangerZoneCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This action removes every member and all data associated with the team.
        </p>
        <form action={action}>
          <Button
            type="submit"
            variant="destructive"
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete team
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default DangerZoneCard;
