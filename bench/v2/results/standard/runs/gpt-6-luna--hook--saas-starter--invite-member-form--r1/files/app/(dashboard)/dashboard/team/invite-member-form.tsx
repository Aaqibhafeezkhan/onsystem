"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function InviteMemberForm() {
  return (
    <form className="grid gap-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
      <div className="grid gap-2">
        <Label htmlFor="invite-email">Email address</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          required
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Role</legend>
        <RadioGroup name="role" defaultValue="member" aria-label="Role">
          <Label
            htmlFor="role-member"
            className="flex cursor-pointer items-start gap-3 rounded-md border p-4"
          >
            <RadioGroupItem id="role-member" value="member" className="mt-0.5" />
            <span className="grid gap-1">
              <span>Member</span>
              <span className="text-sm font-normal text-muted-foreground">
                Can access and collaborate with the team.
              </span>
            </span>
          </Label>
          <Label
            htmlFor="role-owner"
            className="flex cursor-pointer items-start gap-3 rounded-md border p-4"
          >
            <RadioGroupItem id="role-owner" value="owner" className="mt-0.5" />
            <span className="grid gap-1">
              <span>Owner</span>
              <span className="text-sm font-normal text-muted-foreground">
                Can manage the team and its settings.
              </span>
            </span>
          </Label>
        </RadioGroup>
      </fieldset>

      <Button type="submit" className="w-full sm:w-fit">
        Invite member
      </Button>
    </form>
  );
}
