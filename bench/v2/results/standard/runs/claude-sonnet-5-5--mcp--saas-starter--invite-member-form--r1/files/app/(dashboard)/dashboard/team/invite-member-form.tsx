'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function InviteMemberForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <RadioGroup
          name="role"
          defaultValue="member"
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="member" id="role-member" />
            <Label htmlFor="role-member">Member</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="owner" id="role-owner" />
            <Label htmlFor="role-owner">Owner</Label>
          </div>
        </RadioGroup>
      </div>
      <Button type="submit">Invite member</Button>
    </form>
  );
}
