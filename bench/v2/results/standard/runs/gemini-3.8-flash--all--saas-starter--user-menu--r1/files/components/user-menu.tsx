'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface UserMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    initials?: string | null;
  } | null;
  initials?: string;
  name?: string;
  email?: string;
  image?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void;
  className?: string;
  'aria-label'?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email?.trim()) {
    const local = email.trim().split('@')[0];
    const parts = local.split(/[._-]/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }
  return 'JD';
}

export function UserMenu({
  user,
  initials,
  name,
  email,
  image,
  open,
  defaultOpen,
  onOpenChange,
  onSettings,
  onBilling,
  onSignOut,
  className,
  'aria-label': ariaLabel,
}: UserMenuProps = {}) {
  const resolvedName = name ?? user?.name ?? undefined;
  const resolvedEmail = email ?? user?.email ?? undefined;
  const resolvedImage = image ?? user?.image ?? undefined;
  const resolvedInitials =
    initials ??
    user?.initials ??
    getInitials(resolvedName, resolvedEmail);

  return (
    <DropdownMenu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('rounded-full', className)}
          aria-label={ariaLabel}
        >
          <Avatar className="size-full">
            {resolvedImage && (
              <AvatarImage src={resolvedImage} alt={resolvedName || 'User avatar'} />
            )}
            <AvatarFallback>{resolvedInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onSettings}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onBilling}>
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="text-destructive"
          onSelect={onSignOut}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
