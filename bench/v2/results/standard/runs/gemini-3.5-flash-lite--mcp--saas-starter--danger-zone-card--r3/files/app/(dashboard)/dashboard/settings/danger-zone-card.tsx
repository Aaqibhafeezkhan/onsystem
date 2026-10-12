import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface DangerZoneCardProps extends React.ComponentProps<typeof Card> {
  onDelete?: () => void;
  action?: string | ((formData: FormData) => void | Promise<void>);
  isPending?: boolean;
}

export function DangerZoneCard({
  onDelete,
  action,
  isPending,
  className,
  ...props
}: DangerZoneCardProps) {
  const content = (
    <>
      <CardHeader>
        <CardTitle className="text-destructive">Delete team</CardTitle>
        <CardDescription>
          This removes every member and all data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type={action ? 'submit' : 'button'}
          variant="destructive"
          onClick={onDelete}
          disabled={isPending}
        >
          Delete team
        </Button>
      </CardContent>
    </>
  );

  return (
    <Card className={className} {...props}>
      {action ? <form action={action}>{content}</form> : content}
    </Card>
  );
}
