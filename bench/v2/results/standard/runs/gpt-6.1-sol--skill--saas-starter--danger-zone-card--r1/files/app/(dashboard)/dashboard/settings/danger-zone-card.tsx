import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function DangerZoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive" role="heading" aria-level={2}>
          Delete team
        </CardTitle>
        <CardDescription>
          Deleting this team permanently removes every member and all team data.
          This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button type="button" variant="destructive">
          Delete team
        </Button>
      </CardFooter>
    </Card>
  );
}
