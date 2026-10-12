"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type TeamRole = "member" | "owner";

export type InviteMemberValues = {
  email: string;
  role: TeamRole;
};

const ROLE_OPTIONS: { value: TeamRole; label: string; description: string }[] = [
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

export function InviteMemberForm({
  onInvite,
}: {
  onInvite?: (values: InviteMemberValues) => void;
}) {
  const [role, setRole] = React.useState<TeamRole>("member");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    onInvite?.({ email, role });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="invite-member-email">Email</Label>
        <Input
          id="invite-member-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Role</legend>
        <RadioGroup
          name="role"
          value={role}
          onValueChange={(value) => setRole(value as TeamRole)}
          className="gap-3"
        >
          {ROLE_OPTIONS.map((option) => {
            const id = `invite-member-role-${option.value}`;
            return (
              <div key={option.value} className="flex items-start gap-3">
                <RadioGroupItem id={id} value={option.value} className="mt-0.5" />
                <div className="grid gap-1">
                  <Label htmlFor={id}>{option.label}</Label>
                  <p className="text-muted-foreground text-sm">
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
