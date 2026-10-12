'use client';

import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

type InviteMemberFormProps = {
  action?: (formData: FormData) => void | Promise<void>;
  isPending?: boolean;
  error?: string;
};

const roles = [
  {
    value: 'member',
    label: 'Member',
    description: 'Can view and use the team workspace.'
  },
  {
    value: 'owner',
    label: 'Owner',
    description: 'Can manage team settings and members.'
  }
] as const;

export function InviteMemberForm({
  action,
  isPending = false,
  error
}: InviteMemberFormProps) {
  const emailId = useId();

  return (
    <form className="space-y-4" action={action}>
      <div>
        <Label htmlFor={emailId} className="mb-2">
          Email
        </Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          placeholder="Enter email address"
          autoComplete="email"
          required
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm leading-none font-medium">Role</legend>
        <RadioGroup name="role" defaultValue="member" required>
          {roles.map((role) => {
            const itemId = `${emailId}-role-${role.value}`;
            return (
              <div key={role.value} className="flex items-start gap-3">
                <RadioGroupItem value={role.value} id={itemId} className="mt-0.5" />
                <div className="grid gap-1">
                  <Label htmlFor={itemId}>{role.label}</Label>
                  <p className="text-muted-foreground text-sm">
                    {role.description}
                  </p>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </fieldset>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Inviting...
          </>
        ) : (
          'Invite member'
        )}
      </Button>
    </form>
  );
}
