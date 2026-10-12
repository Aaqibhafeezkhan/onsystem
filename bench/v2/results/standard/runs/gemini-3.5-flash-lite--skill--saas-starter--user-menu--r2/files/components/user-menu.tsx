'use client';

import * as React from 'react';
import Link from 'next/link';
import { Settings, CreditCard, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserMenuProps extends React.ComponentProps<typeof DropdownMenu> {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
  settingsHref?: string;
  billingHref?: string;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void | Promise<void>;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'U';
}

export function UserMenu({
  user,
  name: nameProp,
  email: emailProp,
  image: imageProp,
  avatarUrl,
  settingsHref = '/dashboard',
  billingHref = '/pricing',
  onSettings,
  onBilling,
  onSignOut,
  className,
  ...props
}: UserMenuProps) {
  const name = nameProp ?? user?.name;
  const email = emailProp ?? user?.email;
  const image = imageProp ?? avatarUrl ?? user?.image;
  const initials = getInitials(name, email);

  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger
        aria-label="User menu"
        className={cn(
          'relative flex rounded-full focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
          className
        )}
      >
        <Avatar className="cursor-pointer size-9">
          <AvatarImage src={image || undefined} alt={name || email || 'User avatar'} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {onSettings ? (
          <DropdownMenuItem onClick={onSettings} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={settingsHref} className="flex w-full items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        )}

        {onBilling ? (
          <DropdownMenuItem onClick={onBilling} className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={billingHref} className="flex w-full items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {onSignOut ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={onSignOut}
            className="cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
