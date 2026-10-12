'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type UserMenuProps = {
  user: {
    name?: string | null;
    email: string;
  };
  onSettings: () => void;
  onBilling: () => void;
  onSignOut: () => void | Promise<void>;
};

export function UserMenu({
  user,
  onSettings,
  onBilling,
  onSignOut
}: UserMenuProps) {
  const name = user.name?.trim();
  const displayName = name || user.email;
  const nameParts = name?.split(/\s+/) ?? [];
  const initials = nameParts.length
    ? `${nameParts[0][0]}${nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : ''}`.toUpperCase()
    : user.email.slice(0, 2).toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`Open user menu for ${displayName}`}
        >
          <Avatar aria-hidden="true">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onSettings}>Settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={onBilling}>Billing</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => void onSignOut()}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
