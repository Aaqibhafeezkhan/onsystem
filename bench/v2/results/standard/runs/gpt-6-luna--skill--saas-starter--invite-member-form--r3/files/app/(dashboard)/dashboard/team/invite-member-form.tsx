'use client';

import { useActionState } from 'react';
import { inviteTeamMember } from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group';

type InviteState = {
  error?: string;
  success?: string;
};

export function InviteMemberForm() {
  const [state, formAction, isPending] = useActionState<InviteState, FormData>(
    inviteTeamMember,
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite team member</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="invite-email" className="mb-2">
              Email
            </Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="Enter email"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <Label id="invite-role-label" className="mb-2">
              Role
            </Label>
            <RadioGroup
              aria-labelledby="invite-role-label"
              defaultValue="member"
              name="role"
              className="flex gap-4"
            >
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

          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          {state.success && (
            <p role="status" className="text-sm text-muted-foreground">
              {state.success}
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Inviting...' : 'Invite member'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
