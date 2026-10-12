'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, PlusCircle } from 'lucide-react';
import { inviteTeamMember } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';
import { ActionState } from '@/lib/auth/middleware';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type InviteMemberFormProps = {
  action?: (state: ActionState, payload: FormData) => Promise<ActionState>;
  state?: ActionState;
  isPending?: boolean;
  isOwner?: boolean;
};

export function InviteMemberForm({
  action = inviteTeamMember,
  state: externalState,
  isPending: externalIsPending,
  isOwner: externalIsOwner,
}: InviteMemberFormProps) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = externalIsOwner !== undefined ? externalIsOwner : user?.role === 'owner';

  const [internalState, formAction, internalIsPending] = useActionState<
    ActionState,
    FormData
  >(action, {});

  const state = externalState || internalState;
  const isPending = externalIsPending !== undefined ? externalIsPending : internalIsPending;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email" className="mb-2">
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
        <Label className="mb-2">Role</Label>
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
      {state?.error && (
        <p className="text-red-500 text-sm">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-green-500 text-sm">{state.success}</p>
      )}
      <Button
        type="submit"
        className="bg-orange-500 hover:bg-orange-600 text-white"
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

export default InviteMemberForm;
