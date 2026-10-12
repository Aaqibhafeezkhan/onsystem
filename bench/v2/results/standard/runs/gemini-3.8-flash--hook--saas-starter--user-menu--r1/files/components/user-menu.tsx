'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, CreditCard, LogOut } from 'lucide-react';
import useSWR, { mutate } from 'swr';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { signOut } from '@/app/(login)/actions';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/db/schema';

export interface UserMenuUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatar?: string | null;
}

export interface UserMenuProps {
  user?: UserMenuUser | null;
  initials?: string;
  settingsHref?: string;
  billingHref?: string;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function getUserInitials(
  user?: UserMenuUser | null,
  fallbackInitials?: string
): string {
  if (fallbackInitials) {
    return fallbackInitials.trim().toUpperCase();
  }
  if (!user) {
    return 'U';
  }
  if (user.name && user.name.trim()) {
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0][0].toUpperCase();
    }
  }
  if (user.email && user.email.trim()) {
    const emailPrefix = user.email.trim().split('@')[0];
    const parts = emailPrefix.split(/[._\-\s]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0][0].toUpperCase();
    }
  }
  return 'U';
}

export function UserMenu({
  user: propUser,
  initials: propInitials,
  settingsHref = '/dashboard/general',
  billingHref = '/pricing',
  onSettings,
  onBilling,
  onSignOut,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  className
}: UserMenuProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const onOpenChange = controlledOnOpenChange || setUncontrolledOpen;

  const { data: swrUser } = useSWR<User>(
    propUser !== undefined ? null : '/api/user',
    fetcher
  );

  let router: ReturnType<typeof useRouter> | null = null;
  try {
    router = useRouter();
  } catch {
    router = null;
  }

  const currentUser = propUser !== undefined ? propUser : swrUser;
  const initials = getUserInitials(currentUser, propInitials);
  const avatarSrc = currentUser?.image || currentUser?.avatar;

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
      return;
    }
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
    mutate('/api/user');
    if (router) {
      router.push('/');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative size-9 rounded-full cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
          aria-label="User menu"
        >
          <Avatar className="size-9">
            {avatarSrc && (
              <AvatarImage
                src={avatarSrc}
                alt={currentUser?.name || currentUser?.email || 'User avatar'}
              />
            )}
            <AvatarFallback className="text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onSettings && !settingsHref ? (
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={onSettings}
            onClick={onSettings}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            asChild
            className="cursor-pointer"
            onSelect={onSettings}
          >
            <Link
              href={settingsHref}
              className="flex w-full items-center"
              onClick={onSettings}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        )}
        {onBilling && !billingHref ? (
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={onBilling}
            onClick={onBilling}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            asChild
            className="cursor-pointer"
            onSelect={onBilling}
          >
            <Link
              href={billingHref}
              className="flex w-full items-center"
              onClick={onBilling}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={handleSignOut}
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
