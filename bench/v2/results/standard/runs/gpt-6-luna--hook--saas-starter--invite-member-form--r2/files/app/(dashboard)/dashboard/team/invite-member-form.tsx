'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function InviteMemberForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite a team member</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Role</legend>
            <RadioGroup name="role" defaultValue="member" className="gap-3">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="role-member" value="member" />
                <Label htmlFor="role-member">Member</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="role-owner" value="owner" />
                <Label htmlFor="role-owner">Owner</Label>
              </div>
            </RadioGroup>
          </fieldset>

          <Button type="submit">Invite member</Button>
        </form>
      </CardContent>
    </Card>
  );
}
