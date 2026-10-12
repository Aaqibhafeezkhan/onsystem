'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, PlusCircle } from 'lucide-react';
import { inviteTeamMember } from '@/app/(login)/actions';

type ActionState = {
  error?: string;
  success?: string;
};

type InviteMemberFormProps = {
  action?: (state: ActionState, payload: FormData) => void | Promise<ActionState>;
  state?: ActionState;
  isPending?: boolean;
  isOwner?: boolean;
};

export function InviteMemberForm({
  action: propAction,
  state: propState,
  isPending: propIsPending,
  isOwner = true,
}: InviteMemberFormProps) {
  const [defaultState, defaultAction, defaultIsPending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});

  const state = propState ?? defaultState;
  const formAction = propAction ?? defaultAction;
  const isPending = propIsPending ?? defaultIsPending;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email" className="mb-2 block">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter email"
          required
          disabled={!isOwner}
        />
      </div>
      <div>
        <Label className="mb-2 block">Role</Label>
        <RadioGroup
          defaultValue="member"
          name="role"
          className="flex space-x-4"
          disabled={!isOwner}
        >
          <div className="flex items-center space-x-2 mt-2">
            <RadioGroupItem value="member" id="member" />
            <Label htmlFor="member">Member</Label>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <RadioGroupItem value="owner" id="owner" />
            <Label htmlFor="owner">Owner</Label>
          </div>
        </RadioGroup>
      </div>
      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state?.success && <p className="text-muted-foreground text-sm">{state.success}</p>}
      <Button
        type="submit"
        disabled={isPending || !isOwner}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Inviting...
          </>
        ) : (
          <>
            <PlusCircle className="mr-2 h-4 w-4" />
            Invite Member
          </>
        )}
      </Button>
    </form>
  );
}
