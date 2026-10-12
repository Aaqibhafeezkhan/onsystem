import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

type DangerZoneCardProps = React.ComponentProps<typeof Card> & {
  onDelete?: () => void;
  isPending?: boolean;
};

export function DangerZoneCard({
  className,
  onDelete,
  isPending,
  ...props
}: DangerZoneCardProps = {}) {
  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle role="heading" className="text-destructive">
          Delete team
        </CardTitle>
        <CardDescription>
          This action cannot be undone. This removes every member and all data.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          variant="destructive"
          onClick={onDelete}
          disabled={isPending}
        >
          Delete team
        </Button>
      </CardFooter>
    </Card>
  );
}

export default DangerZoneCard;
