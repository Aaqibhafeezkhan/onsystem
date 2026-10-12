'use client';

import { useActionState, useId } from 'react';
import { Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { inviteTeamMember } from '@/app/(login)/actions';

type ActionState = {
  error?: string;
  success?: string;
};

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'owner', label: 'Owner' }
] as const;

export function InviteMemberForm() {
  const id = useId();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    inviteTeamMember,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${id}-email`}>Email</Label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          placeholder="Enter email"
          autoComplete="email"
          required
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm leading-none font-medium">Role</legend>
        <RadioGroup
          name="role"
          defaultValue="member"
          className="flex flex-wrap gap-4 pt-1"
        >
          {ROLE_OPTIONS.map((option) => {
            const itemId = `${id}-role-${option.value}`;
            return (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem value={option.value} id={itemId} />
                <Label htmlFor={itemId} className="font-normal">
                  {option.label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </fieldset>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-sm text-muted-foreground">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Inviting...
          </>
        ) : (
          <>
            <PlusCircle />
            Invite member
          </>
        )}
      </Button>
    </form>
  );
}
