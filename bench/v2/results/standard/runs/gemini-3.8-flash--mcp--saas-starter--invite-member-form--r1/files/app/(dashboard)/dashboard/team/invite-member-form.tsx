'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { inviteTeamMember } from '@/app/(login)/actions';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActionState = {
  error?: string;
  success?: string;
};

interface InviteMemberFormProps
  extends Omit<React.ComponentProps<'form'>, 'action'> {
  action?: ((formData: FormData) => void | Promise<void>) | string;
  state?: ActionState;
  isPending?: boolean;
  defaultRole?: 'member' | 'owner';
}

export function InviteMemberForm({
  action,
  className,
  state: externalState,
  isPending: externalIsPending,
  defaultRole = 'member',
  ...props
}: InviteMemberFormProps) {
  const [internalState, formAction, internalIsPending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});

  const state = externalState ?? internalState;
  const isPending = externalIsPending ?? internalIsPending;

  return (
    <form
      action={action ?? formAction}
      className={cn('space-y-4', className)}
      {...props}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter email"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label id="role-label">Role</Label>
        <RadioGroup
          defaultValue={defaultRole}
          name="role"
          aria-labelledby="role-label"
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="member" id="member" />
            <Label htmlFor="member">Member</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="owner" id="owner" />
            <Label htmlFor="owner">Owner</Label>
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
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Invite member
      </Button>
    </form>
  );
}

export default InviteMemberForm;
