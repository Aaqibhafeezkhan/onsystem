'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function InviteMemberForm() {
  return (
    <form className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email address</Label>
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
        <RadioGroup
          name="role"
          defaultValue="member"
          aria-label="Role"
          className="gap-3 sm:grid-cols-2"
        >
          <Label
            htmlFor="role-member"
            className="flex cursor-pointer items-start gap-3 rounded-md border p-4"
          >
            <RadioGroupItem id="role-member" value="member" />
            <span className="space-y-1">
              <span className="block">Member</span>
              <span className="block text-sm font-normal text-muted-foreground">
                Can collaborate with the team.
              </span>
            </span>
          </Label>
          <Label
            htmlFor="role-owner"
            className="flex cursor-pointer items-start gap-3 rounded-md border p-4"
          >
            <RadioGroupItem id="role-owner" value="owner" />
            <span className="space-y-1">
              <span className="block">Owner</span>
              <span className="block text-sm font-normal text-muted-foreground">
                Can manage the team and its members.
              </span>
            </span>
          </Label>
        </RadioGroup>
      </fieldset>

      <Button type="submit">Invite member</Button>
    </form>
  );
}
