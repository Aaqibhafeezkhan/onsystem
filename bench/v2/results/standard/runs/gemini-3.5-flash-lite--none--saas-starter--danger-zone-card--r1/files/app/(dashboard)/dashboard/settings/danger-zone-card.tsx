import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DangerZoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">Delete team</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">
          Deleting the team will remove every member and all data.
        </p>
        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
          Delete team
        </Button>
      </CardContent>
    </Card>
  );
}
