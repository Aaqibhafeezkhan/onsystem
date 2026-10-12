"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type InviteMemberFormProps = {
  action?: (formData: FormData) => void | Promise<void>;
  isPending?: boolean;
};

export function InviteMemberForm({ action, isPending = false }: InviteMemberFormProps) {
  const emailId = React.useId();
  const memberId = React.useId();
  const ownerId = React.useId();

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          placeholder="Enter email"
          autoComplete="email"
          required
        />
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm leading-none font-medium">Role</legend>
        <RadioGroup name="role" defaultValue="member" className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="member" id={memberId} />
            <Label htmlFor={memberId}>Member</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="owner" id={ownerId} />
            <Label htmlFor={ownerId}>Owner</Label>
          </div>
        </RadioGroup>
      </fieldset>

      <Button type="submit" disabled={isPending}>
        Invite member
      </Button>
    </form>
  );
}
