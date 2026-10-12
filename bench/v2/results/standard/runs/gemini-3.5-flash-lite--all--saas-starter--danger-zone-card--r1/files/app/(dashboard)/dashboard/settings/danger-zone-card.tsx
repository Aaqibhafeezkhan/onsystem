'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DangerZoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
        <CardDescription>
          This removes every member and all data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive">Delete team</Button>
      </CardContent>
    </Card>
  );
}
