'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

interface DangerZoneCardProps extends React.ComponentProps<typeof Card> {
  onDelete?: () => void;
  disabled?: boolean;
}

export function DangerZoneCard({
  className,
  onDelete,
  disabled,
  ...props
}: DangerZoneCardProps) {
  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle role="heading" className="text-destructive">
          Delete team
        </CardTitle>
        <CardDescription>
          This action cannot be undone. Deleting this team removes every member and all data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={onDelete}
          disabled={disabled}
        >
          Delete team
        </Button>
      </CardContent>
    </Card>
  );
}

export default DangerZoneCard;
