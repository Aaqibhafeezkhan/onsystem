'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type TeamMemberRole = 'member' | 'owner';

const ROLE_OPTIONS: { value: TeamMemberRole; label: string; description: string }[] = [
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
];

type InviteMemberFormProps = {
  action?: (formData: FormData) => void | Promise<void>;
  isPending?: boolean;
};

export function InviteMemberForm({ action, isPending = false }: InviteMemberFormProps) {
  const baseId = useId();
  const emailId = `${baseId}-email`;
  const [role, setRole] = useState<TeamMemberRole>('member');

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
        <legend className="text-sm leading-none font-medium mb-2">Role</legend>
        <RadioGroup
          name="role"
          value={role}
          onValueChange={(value) => setRole(value as TeamMemberRole)}
          className="gap-3"
        >
          {ROLE_OPTIONS.map((option) => {
            const itemId = `${baseId}-role-${option.value}`;
            return (
              <div key={option.value} className="flex items-start gap-3">
                <RadioGroupItem value={option.value} id={itemId} className="mt-0.5" />
                <div className="grid gap-1">
                  <Label htmlFor={itemId}>{option.label}</Label>
                  <p className="text-muted-foreground text-sm">{option.description}</p>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </fieldset>

      <Button type="submit" disabled={isPending}>
        Invite member
      </Button>
    </form>
  );
}
