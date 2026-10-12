'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

import { signOut } from '@/app/(login)/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const { data: user, mutate } = useSWR<User | null>('/api/user', fetchUser);
  const router = useRouter();

  if (!user) return null;

  const name = user.name?.trim();
  const parts = name ? name.split(/\s+/) : [];
  const initials = (parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : (parts[0]?.slice(0, 1) || user.email.slice(0, 1))
  ).toUpperCase();

  async function handleSignOut() {
    await signOut();
    await mutate(null, { revalidate: false });
    router.push('/');
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`Open user menu for ${name || user.email}`}
        >
          <Avatar className="size-9">
            <AvatarFallback className="text-foreground text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 border-border">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/general">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Billing</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
