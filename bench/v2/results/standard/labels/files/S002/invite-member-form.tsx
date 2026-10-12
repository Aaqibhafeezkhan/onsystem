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

export function InviteMemberForm({
  action,
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    inviteTeamMember,
    {}
  );

  return (
    <form
      action={action || formAction}
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
          defaultValue="member"
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
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-muted-foreground">{state.success}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Invite member
      </Button>
    </form>
  );
}

export default InviteMemberForm;
