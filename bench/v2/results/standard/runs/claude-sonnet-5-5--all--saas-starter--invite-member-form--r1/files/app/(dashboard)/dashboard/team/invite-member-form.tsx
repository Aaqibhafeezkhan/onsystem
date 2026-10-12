"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function InviteMemberForm() {
  return (
    <form className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          placeholder="name@example.com"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Role</Label>
        <RadioGroup name="role" defaultValue="member">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="member" id="invite-role-member" />
            <Label htmlFor="invite-role-member">Member</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="owner" id="invite-role-owner" />
            <Label htmlFor="invite-role-owner">Owner</Label>
          </div>
        </RadioGroup>
      </div>
      <Button type="submit">Invite member</Button>
    </form>
  );
}
