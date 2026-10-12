'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { inviteTeamMember } from '@/app/(login)/actions';
import { Loader2, PlusCircle } from 'lucide-react';

type ActionState = {
  error?: string;
  success?: string;
};

export function InviteMemberForm() {
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});

  return (
    <form action={inviteAction} className="space-y-4">
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
        />
      </div>
      <div>
        <Label className="mb-2">Role</Label>
        <RadioGroup
          defaultValue="member"
          name="role"
          className="flex space-x-4"
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
      {inviteState?.error && (
        <p className="text-red-500 text-sm">{inviteState.error}</p>
      )}
      {inviteState?.success && (
        <p className="text-green-500 text-sm">{inviteState.success}</p>
      )}
      <Button
        type="submit"
        className="bg-orange-500 hover:bg-orange-600 text-white"
        disabled={isInvitePending}
      >
        {isInvitePending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Inviting...
          </>
        ) : (
          <>
            <PlusCircle className="mr-2 h-4 w-4" />
            Invite member
          </>
        )}
      </Button>
    </form>
  );
}

export default InviteMemberForm;
