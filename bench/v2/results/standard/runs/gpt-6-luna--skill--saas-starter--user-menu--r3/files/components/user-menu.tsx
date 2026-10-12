'use client';

import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/(login)/actions';
import type { User } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((response) => response.json());

export function UserMenu() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  if (!user) return null;

  const initials = (user.name?.trim() || user.email)
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full p-0"
          aria-label="Open user menu"
        >
          <Avatar className="size-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => router.push('/dashboard/general')}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/pricing')}>
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
