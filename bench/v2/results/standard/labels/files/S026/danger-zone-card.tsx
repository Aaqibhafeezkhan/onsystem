import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function DangerZoneCard(props: React.ComponentProps<typeof Card>) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className="text-destructive" role="heading" aria-level={2}>
          Delete team
        </CardTitle>
        <CardDescription>
          This action cannot be undone. This removes every member and all data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive">Delete team</Button>
      </CardContent>
    </Card>
  );
}

export default DangerZoneCard;
