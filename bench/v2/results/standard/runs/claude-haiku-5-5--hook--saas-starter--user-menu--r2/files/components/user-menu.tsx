'use client';

import { CreditCard, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface UserMenuProps {
  /** Display name of the signed-in user; used to derive initials. */
  name?: string | null;
  /** Email address, used for initials when no name is available. */
  email?: string | null;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void;
  className?: string;
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split('@')[0]?.trim() || '';
  const initials = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return initials || '?';
}

export function UserMenu({
  name,
  email,
  onSettings,
  onBilling,
  onSignOut,
  className
}: UserMenuProps) {
  const initials = getInitials(name, email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        className={cn(
          'rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer',
          className
        )}
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className="cursor-pointer" onSelect={onSettings}>
          <Settings />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onSelect={onBilling}>
          <CreditCard />
          <span>Billing</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onSelect={onSignOut}
        >
          <LogOut />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
