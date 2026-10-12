'use client';

import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type TeamRole = 'member' | 'owner';

const ROLE_OPTIONS: { value: TeamRole; label: string; description: string }[] =
  [
    {
      value: 'member',
      label: 'Member',
      description: 'Can view and use the team workspace.'
    },
    {
      value: 'owner',
      label: 'Owner',
      description: 'Can manage team members and settings.'
    }
  ];

type InviteMemberFormProps = {
  onInvite?: (data: { email: string; role: TeamRole }) => void;
  isPending?: boolean;
  error?: string;
};

export function InviteMemberForm({
  onInvite,
  isPending = false,
  error
}: InviteMemberFormProps) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('member');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onInvite?.({ email: email.trim(), role });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor={`${id}-email`} className="mb-2">
          Email
        </Label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          placeholder="Enter email address"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm leading-none font-medium select-none">
          Role
        </legend>
        <RadioGroup
          name="role"
          value={role}
          onValueChange={(value) => setRole(value as TeamRole)}
          className="gap-3"
        >
          {ROLE_OPTIONS.map((option) => {
            const itemId = `${id}-role-${option.value}`;
            return (
              <div key={option.value} className="flex items-start gap-3">
                <RadioGroupItem
                  id={itemId}
                  value={option.value}
                  className="mt-0.5"
                />
                <div className="grid gap-1">
                  <Label htmlFor={itemId}>{option.label}</Label>
                  <p className="text-muted-foreground text-sm">
                    {option.description}
                  </p>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </fieldset>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={isPending}>
        Invite member
      </Button>
    </form>
  );
}
