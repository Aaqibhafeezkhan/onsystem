"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ROLES = [
  {
    value: "member",
    label: "Member",
    description: "Can view and use the team's resources."
  },
  {
    value: "owner",
    label: "Owner",
    description: "Can manage team settings and members."
  }
] as const;

export function InviteMemberForm() {
  const id = React.useId();
  const emailId = `${id}-email`;

  return (
    <form className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          required
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-3 text-sm leading-none font-medium">Role</legend>
        <RadioGroup name="role" defaultValue="member" required className="gap-3">
          {ROLES.map((role) => {
            const itemId = `${id}-role-${role.value}`;
            return (
              <div key={role.value} className="flex items-start gap-3">
                <RadioGroupItem id={itemId} value={role.value} className="mt-0.5" />
                <div className="grid gap-1">
                  <Label htmlFor={itemId}>{role.label}</Label>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit">Invite member</Button>
      </div>
    </form>
  );
}
