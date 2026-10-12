'use client';

import { useActionState } from 'react';
import { inviteTeamMember } from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type InviteMemberState = {
  error?: string;
  success?: string;
};

export function InviteMemberForm() {
  const [state, formAction, isPending] = useActionState<InviteMemberState, FormData>(
    inviteTeamMember,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="Enter email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label id="invite-role-label">Role</Label>
        <RadioGroup
          name="role"
          defaultValue="member"
          aria-labelledby="invite-role-label"
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="member" id="invite-role-member" />
            <Label htmlFor="invite-role-member">Member</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="owner" id="invite-role-owner" />
            <Label htmlFor="invite-role-owner">Owner</Label>
          </div>
        </RadioGroup>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-muted-foreground" role="status">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Inviting...' : 'Invite member'}
      </Button>
    </form>
  );
}
