'use client';

import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { inviteTeamMember } from '@/app/(login)/actions';

type ActionState = {
  error?: string;
  success?: string;
};

export function InviteMemberForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    inviteTeamMember,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="invite-email" className="mb-2">
          Email
        </Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="Enter email"
          required
        />
      </div>
      <div>
        <Label>Role</Label>
        <RadioGroup
          defaultValue="member"
          name="role"
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2 mt-2">
            <RadioGroupItem value="member" id="invite-role-member" />
            <Label htmlFor="invite-role-member">Member</Label>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <RadioGroupItem value="owner" id="invite-role-owner" />
            <Label htmlFor="invite-role-owner">Owner</Label>
          </div>
        </RadioGroup>
      </div>
      {state?.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-muted-foreground text-sm">{state.success}</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Inviting...
          </>
        ) : (
          'Invite member'
        )}
      </Button>
    </form>
  );
}
