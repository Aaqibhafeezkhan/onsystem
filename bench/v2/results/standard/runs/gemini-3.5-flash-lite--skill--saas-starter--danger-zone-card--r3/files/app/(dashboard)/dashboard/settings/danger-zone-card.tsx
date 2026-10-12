'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DangerZoneCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">Delete team</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">
          This action will permanently remove every member and all data associated with the team. Please proceed with caution.
        </p>
        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
          Delete team
        </Button>
      </CardContent>
    </Card>
  );
}

export default DangerZoneCard;
