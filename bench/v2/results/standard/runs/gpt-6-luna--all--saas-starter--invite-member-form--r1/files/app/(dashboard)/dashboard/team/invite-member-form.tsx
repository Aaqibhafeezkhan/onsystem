import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function InviteMemberForm() {
  return (
    <form className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
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

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Role</legend>
        <RadioGroup name="role" defaultValue="member" required>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="role-member" value="member" />
            <Label htmlFor="role-member">Member</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="role-owner" value="owner" />
            <Label htmlFor="role-owner">Owner</Label>
          </div>
        </RadioGroup>
      </fieldset>

      <Button type="submit">Invite member</Button>
    </form>
  );
}
