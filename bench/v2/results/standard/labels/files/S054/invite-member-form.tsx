'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { inviteTeamMember } from '@/app/(login)/actions';
import { Loader2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActionState = {
  error?: string;
  success?: string;
};

type InviteMemberFormProps = {
  isOwner?: boolean;
  disabled?: boolean;
  className?: string;
  action?: (formData: FormData) => void | Promise<void>;
} & Omit<React.ComponentProps<'form'>, 'action'>;

export function InviteMemberForm({
  isOwner = true,
  disabled = false,
  className,
  action,
  ...props
}: InviteMemberFormProps = {}) {
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});

  const isDisabled = disabled || !isOwner;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={action || inviteAction}
          className="space-y-4"
          aria-label="Invite member"
          {...props}
        >
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
              disabled={isDisabled}
            />
          </div>
          <div>
            <Label className="mb-2">Role</Label>
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex space-x-4"
              disabled={isDisabled}
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
          {inviteState?.error && (
            <p className="text-destructive text-sm">{inviteState.error}</p>
          )}
          {inviteState?.success && (
            <p className="text-muted-foreground text-sm">{inviteState.success}</p>
          )}
          <Button
            type="submit"
            disabled={isInvitePending || isDisabled}
          >
            {isInvitePending ? (
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
      {!isOwner && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            You must be a team owner to invite new members.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default InviteMemberForm;
