'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, PlusCircle } from 'lucide-react';
import { inviteTeamMember } from '@/app/(login)/actions';
import { cn } from '@/lib/utils';

type ActionState = {
  error?: string;
  success?: string;
};

type InviteMemberFormProps = {
  action?: (state: ActionState, formData: FormData) => Promise<ActionState> | ActionState;
  className?: string;
};

export function InviteMemberForm({
  action = inviteTeamMember,
  className
}: InviteMemberFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className={cn('space-y-4', className)}>
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
        <Label className="mb-2 block">Role</Label>
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
      {state?.error && (
        <p className="text-red-500 text-sm">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-green-500 text-sm">{state.success}</p>
      )}
      <Button
        type="submit"
        className="bg-orange-500 hover:bg-orange-600 text-white"
        disabled={isPending}
      >
        {isPending ? (
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
