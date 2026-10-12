'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { signOut } from '@/app/(login)/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { User } from '@/lib/db/schema';

async function fetchUser(url: string): Promise<User | null> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to load user');
  }
  return response.json();
}

export function UserMenu() {
  const { data: user } = useSWR<User | null>('/api/user', fetchUser);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    await mutate('/api/user');
    router.push('/');
  }

  if (!user) return null;

  const displayName = user.name?.trim() || user.email;
  const nameParts = displayName.split(/\s+/);
  const initials = (
    nameParts.length > 1
      ? nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
      : displayName.charAt(0)
  ).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full p-0"
          aria-label={`Open user menu for ${displayName}`}
        >
          <Avatar className="size-9" aria-hidden="true">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/general">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Billing</Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
