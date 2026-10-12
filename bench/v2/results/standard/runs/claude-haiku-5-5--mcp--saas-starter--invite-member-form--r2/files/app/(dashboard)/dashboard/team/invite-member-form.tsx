"use client";

import * as React from "react";

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
    description: "Can manage team settings, members and billing.",
  },
] as const;

export function InviteMemberForm() {
  const emailId = React.useId();
  const roleLegendId = React.useId();

  return (
    <form className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
        />
      </div>

      <fieldset className="grid gap-3">
        <legend id={roleLegendId} className="text-sm font-medium">
          Role
        </legend>
        <RadioGroup
          name="role"
          defaultValue="member"
          aria-labelledby={roleLegendId}
          className="gap-3"
        >
          {roles.map((role) => {
            const itemId = `${emailId}-${role.value}`;
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

      <div className="flex justify-end">
        <Button type="submit">Invite member</Button>
      </div>
    </form>
  );
}
