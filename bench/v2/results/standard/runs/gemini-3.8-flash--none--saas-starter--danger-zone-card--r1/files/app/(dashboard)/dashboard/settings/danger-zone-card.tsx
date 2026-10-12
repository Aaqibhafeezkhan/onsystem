import type { ComponentProps } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DangerZoneCard({
  className,
  ...props
}: ComponentProps<typeof Card>) {
  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="text-destructive">
          Delete team
        </CardTitle>
        <CardDescription>
          This action cannot be undone. This permanently removes every member and all data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive">Delete team</Button>
      </CardContent>
    </Card>
  );
}

export default DangerZoneCard;
