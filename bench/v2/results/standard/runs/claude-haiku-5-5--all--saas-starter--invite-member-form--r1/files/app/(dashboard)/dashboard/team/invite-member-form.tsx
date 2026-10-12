"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Role = "member" | "owner";

const roles: { value: Role; label: string; description: string }[] = [
  {
    value: "member",
    label: "Member",
    description: "Can view and work on team projects.",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Can manage team settings, billing and members.",
  },
];

function InviteMemberForm() {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("member");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="invite-email">Email address</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Role</legend>
        <RadioGroup
          name="role"
          value={role}
          onValueChange={(value) => setRole(value as Role)}
          className="gap-3"
        >
          {roles.map((option) => {
            const id = `invite-role-${option.value}`;
            return (
              <div key={option.value} className="flex items-start gap-3">
                <RadioGroupItem value={option.value} id={id} className="mt-0.5" />
                <div className="grid gap-1">
                  <Label htmlFor={id}>{option.label}</Label>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
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

export { InviteMemberForm };
