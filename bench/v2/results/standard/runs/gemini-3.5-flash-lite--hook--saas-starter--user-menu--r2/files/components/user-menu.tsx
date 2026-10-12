'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Settings, CreditCard, LogOut } from 'lucide-react';
import { signOut } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserMenuProps {
  user?: User | null;
}

export function UserMenu({ user: propUser }: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: swrUser } = useSWR<User>(
    propUser === undefined ? '/api/user' : null,
    fetcher
  );
  const user = propUser !== undefined ? propUser : swrUser;
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return null;
  }

  const initials = (user.name || user.email || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1 w-48">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/pricing" className="flex w-full items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={handleSignOut} className="w-full">
          <DropdownMenuItem
            asChild
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start px-2 py-1.5 h-auto font-normal text-sm bg-transparent hover:bg-destructive/10 text-destructive hover:text-destructive shadow-none"
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
