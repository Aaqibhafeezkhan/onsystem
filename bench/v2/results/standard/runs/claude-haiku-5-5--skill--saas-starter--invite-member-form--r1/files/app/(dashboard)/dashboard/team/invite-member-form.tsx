import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function InviteMemberForm() {
  return (
    <form className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          required
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-3 text-sm leading-none font-medium">Role</legend>
        <RadioGroup name="role" defaultValue="member" className="gap-3">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="member" id="invite-role-member" />
            <Label htmlFor="invite-role-member">Member</Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="owner" id="invite-role-owner" />
            <Label htmlFor="invite-role-owner">Owner</Label>
          </div>
        </RadioGroup>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit">Invite member</Button>
      </div>
    </form>
  );
}
