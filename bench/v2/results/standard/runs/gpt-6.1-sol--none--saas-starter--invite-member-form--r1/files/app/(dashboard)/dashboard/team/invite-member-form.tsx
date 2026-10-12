'use client';

import { useActionState, useId } from 'react';
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
  const id = useId();
  const [state, action, isPending] = useActionState<InviteState, FormData>(
    inviteTeamMember,
    {}
  );

  return (
    <form action={action} className="space-y-4" aria-busy={isPending}>
      <div className="space-y-2">
        <Label htmlFor={`${id}-email`}>Email</Label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter email"
          required
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label id={`${id}-role`}>Role</Label>
        <RadioGroup
          name="role"
          defaultValue="member"
          aria-labelledby={`${id}-role`}
          className="flex gap-4"
          disabled={isPending}
          required
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem id={`${id}-member`} value="member" />
            <Label htmlFor={`${id}-member`}>Member</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id={`${id}-owner`} value="owner" />
            <Label htmlFor={`${id}-owner`}>Owner</Label>
          </div>
        </RadioGroup>
      </div>
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
        {isPending ? 'Inviting...' : 'Invite member'}
      </Button>
    </form>
  );
}
