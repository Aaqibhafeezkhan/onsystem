import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DangerZoneCard({
  onDeleteTeam,
  ...props
}: React.ComponentProps<typeof Card> & {
  onDeleteTeam?: () => void;
}) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
        <CardDescription>
          This removes every member and all data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={onDeleteTeam}>
          Delete team
        </Button>
      </CardContent>
    </Card>
  );
}
