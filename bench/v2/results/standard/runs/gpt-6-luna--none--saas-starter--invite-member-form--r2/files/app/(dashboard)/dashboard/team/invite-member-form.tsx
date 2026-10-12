'use client';

import { useActionState } from 'react';

import { inviteTeamMember } from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type InviteState = {
  error?: string;
  success?: string;
};

export function InviteMemberForm() {
  const [state, formAction, isPending] = useActionState<InviteState, FormData>(
    inviteTeamMember,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="invite-member-email">Email</Label>
        <Input
          id="invite-member-email"
          name="email"
          type="email"
          placeholder="Enter email"
          autoComplete="email"
          required
        />
      </div>

      <fieldset className="space-y-2">
        <legend id="invite-member-role-label" className="text-sm font-medium">
          Role
        </legend>
        <RadioGroup
          aria-labelledby="invite-member-role-label"
          defaultValue="member"
          name="role"
          className="flex gap-5"
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
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-muted-foreground">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Inviting…' : 'Invite member'}
      </Button>
    </form>
  );
}
