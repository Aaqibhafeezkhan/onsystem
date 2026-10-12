'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, CreditCard, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';

interface UserMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  initials?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  image?: string;
  settingsHref?: string;
  billingHref?: string;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void | Promise<void>;
}

export function UserMenu({
  user,
  initials: explicitInitials,
  name,
  email,
  avatarUrl,
  image,
  settingsHref = '/dashboard/general',
  billingHref = '/pricing',
  onSettings,
  onBilling,
  onSignOut,
}: UserMenuProps) {
  const router = useRouter();

  const userName = name || user?.name;
  const userEmail = email || user?.email;
  const userImage = avatarUrl || image || user?.image;

  const initials = React.useMemo(() => {
    if (explicitInitials) return explicitInitials;
    if (userName) {
      const parts = userName.trim().split(/\s+/);
      if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0]?.slice(0, 2).toUpperCase() || '';
    }
    if (userEmail) {
      return userEmail.split('@')[0].slice(0, 2).toUpperCase();
    }
    return '';
  }, [explicitInitials, userName, userEmail]);

  async function handleSignOut(e: React.MouseEvent) {
    e.preventDefault();
    if (onSignOut) {
      await onSignOut();
      return;
    }
    try {
      await signOut();
      router.push('/');
    } catch {
      router.push('/');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <Avatar className="cursor-pointer size-9">
          <AvatarImage src={userImage || undefined} alt={userName || userEmail || 'User avatar'} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1 min-w-48">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={onSettings}
        >
          {onSettings ? (
            <div className="flex w-full items-center" onClick={onSettings}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </div>
          ) : (
            <a href={settingsHref} className="flex w-full items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </a>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer"
        >
          {onBilling ? (
            <div className="flex w-full items-center" onClick={onBilling}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </div>
          ) : (
            <a href={billingHref} className="flex w-full items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </a>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
