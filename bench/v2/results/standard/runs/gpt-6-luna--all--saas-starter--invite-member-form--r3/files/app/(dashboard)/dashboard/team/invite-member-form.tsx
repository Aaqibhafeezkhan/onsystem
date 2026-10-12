import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group';

export function InviteMemberForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label id="invite-role-label">Role</Label>
        <RadioGroup
          aria-labelledby="invite-role-label"
          defaultValue="member"
          name="role"
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem id="invite-role-member" value="member" />
            <Label htmlFor="invite-role-member">Member</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="invite-role-owner" value="owner" />
            <Label htmlFor="invite-role-owner">Owner</Label>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit">Invite member</Button>
    </form>
  );
}
