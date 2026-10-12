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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UserMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  name?: string | null;
  email?: string | null;
  image?: string | null;
  settingsHref?: string;
  billingHref?: string;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void;
  signOutAction?: () => void | Promise<void>;
  className?: string;
}

export function UserMenu({
  user,
  name: nameProp,
  email: emailProp,
  image: imageProp,
  settingsHref = '/settings',
  billingHref = '/billing',
  onSettings,
  onBilling,
  onSignOut,
  signOutAction,
  className,
}: UserMenuProps) {
  const name = user?.name ?? nameProp;
  const email = user?.email ?? emailProp;
  const image = user?.image ?? imageProp;

  const initials = React.useMemo(() => {
    if (name) {
      return name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email
        .split('@')[0]
        .split(/[\.\-_]/)
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  }, [name, email]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('rounded-full relative size-9 overflow-hidden', className)}
          aria-label="User menu"
        >
          <Avatar className="size-full">
            <AvatarImage src={image || undefined} alt={name || email || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1 w-48">
        {onSettings ? (
          <DropdownMenuItem
            onClick={onSettings}
            className="cursor-pointer flex w-full items-center"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link
              href={settingsHref}
              className="cursor-pointer flex w-full items-center"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        )}

        {onBilling ? (
          <DropdownMenuItem
            onClick={onBilling}
            className="cursor-pointer flex w-full items-center"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link
              href={billingHref}
              className="cursor-pointer flex w-full items-center"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {signOutAction ? (
          <form action={signOutAction} className="w-full">
            <DropdownMenuItem asChild className="p-0">
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start font-normal text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer h-auto py-1.5 px-2"
              >
                <LogOut className="mr-2 h-4 w-4 text-destructive" />
                <span>Sign out</span>
              </Button>
            </DropdownMenuItem>
          </form>
        ) : (
          <DropdownMenuItem
            onClick={onSignOut}
            className="cursor-pointer flex w-full items-center text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4 text-destructive" />
            <span>Sign out</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
