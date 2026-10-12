'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type InviteMemberFormProps = {
  action?: (formData: FormData) => void | Promise<void>;
  isPending?: boolean;
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
  isPending = false
}: InviteMemberFormProps) {
  return (
    <form className="space-y-4" action={action}>
      <div>
        <Label htmlFor="invite-email" className="mb-2">
          Email
        </Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="Enter an email address"
          autoComplete="email"
          required
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm leading-none font-medium">Role</legend>
        <RadioGroup
          name="role"
          defaultValue="member"
          required
          className="gap-3"
        >
          {roles.map((role) => (
            <div key={role.value} className="flex items-start gap-3">
              <RadioGroupItem
                id={`invite-role-${role.value}`}
                value={role.value}
                className="mt-0.5"
              />
              <div className="grid gap-1">
                <Label htmlFor={`invite-role-${role.value}`}>
                  {role.label}
                </Label>
                <p className="text-muted-foreground text-sm">
                  {role.description}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <Button type="submit" disabled={isPending}>
        Invite member
      </Button>
    </form>
  );
}
