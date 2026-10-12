'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { inviteTeamMember } from '@/app/(login)/actions';
import { Loader2, PlusCircle } from 'lucide-react';

type ActionState = {
  error?: string;
  success?: string;
};

interface InviteMemberFormProps {
  action?: (state: ActionState, formData: FormData) => Promise<ActionState> | ActionState;
  defaultState?: ActionState;
}

export function InviteMemberForm({
  action = inviteTeamMember,
  defaultState = {},
}: InviteMemberFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    defaultState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite member</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              required
            />
          </div>
          <div>
            <Label className="mb-2 block">Role</Label>
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="member" id="member" />
                <Label htmlFor="member">Member</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="owner" id="owner" />
                <Label htmlFor="owner">Owner</Label>
              </div>
            </RadioGroup>
          </div>
          {state?.error && (
            <p className="text-destructive text-sm">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-muted-foreground">{state.success}</p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite member
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default InviteMemberForm;
