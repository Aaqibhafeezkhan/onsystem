'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, CreditCard, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { signOut } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserMenuProps {
  user?: User | { name?: string | null; email?: string } | null;
}

export function UserMenu({ user: userProp }: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: fetchedUser } = useSWR<User>(
    userProp === undefined ? '/api/user' : null,
    fetcher
  );
  const router = useRouter();

  const user = userProp !== undefined ? userProp : fetchedUser;

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return null;
  }

  const getInitials = (u: { name?: string | null; email?: string }) => {
    if (u.name) {
      return u.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    }
    if (u.email) {
      return u.email
        .split('@')[0]
        .split(/[.\s_]+/)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    }
    return '';
  };

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || user.email || ''} />
          <AvatarFallback>{getInitials(user)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1 w-48">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard/general" className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <DropdownMenuItem variant="destructive" asChild className="w-full cursor-pointer">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start px-2 py-1.5 h-auto font-normal text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 shadow-none"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </Button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
