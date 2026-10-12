'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function InviteMemberForm() {
  return (
    <form className="space-y-4">
      <div>
        <Label htmlFor="invite-member-email" className="mb-2">
          Email
        </Label>
        <Input
          id="invite-member-email"
          name="email"
          type="email"
          placeholder="Enter email"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <Label id="invite-member-role-label" className="mb-2">
          Role
        </Label>
        <RadioGroup
          aria-labelledby="invite-member-role-label"
          defaultValue="member"
          name="role"
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="member" id="invite-member-role-member" />
            <Label htmlFor="invite-member-role-member">Member</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="owner" id="invite-member-role-owner" />
            <Label htmlFor="invite-member-role-owner">Owner</Label>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit">Invite member</Button>
    </form>
  );
}
