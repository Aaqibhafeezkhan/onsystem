"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const roles = [
  {
    value: "member",
    label: "Member",
    description: "Can view and work on team projects.",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Can manage team settings and members.",
  },
] as const;

export function InviteMemberForm() {
  return (
    <form className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="invite-email">Email address</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          required
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium text-foreground">Role</legend>
        <RadioGroup name="role" defaultValue="member" required className="gap-3">
          {roles.map((role) => (
            <div key={role.value} className="flex items-start gap-3">
              <RadioGroupItem
                value={role.value}
                id={`invite-role-${role.value}`}
                aria-describedby={`invite-role-${role.value}-description`}
                className="mt-0.5"
              />
              <div className="grid gap-1">
                <Label htmlFor={`invite-role-${role.value}`}>{role.label}</Label>
                <p
                  id={`invite-role-${role.value}-description`}
                  className="text-sm text-muted-foreground"
                >
                  {role.description}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <Button type="submit">Invite member</Button>
    </form>
  );
}
