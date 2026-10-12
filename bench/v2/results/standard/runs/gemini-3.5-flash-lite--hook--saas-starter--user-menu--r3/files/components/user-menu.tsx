'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { Settings, CreditCard, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserMenuProps {
  user?: User | { name?: string | null; email: string; image?: string | null };
  onSignOut?: () => void | Promise<void>;
}

export function UserMenu({ user: propUser, onSignOut }: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { data: fetchedUser } = useSWR<User>(propUser ? null : '/api/user', fetcher);
  const user = propUser || fetchedUser;
  const router = useRouter();

  async function handleSignOut() {
    if (onSignOut) {
      await onSignOut();
      return;
    }
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  const getInitials = (name?: string | null, email?: string) => {
    const identifier = name || email || '';
    return identifier
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <Avatar className="cursor-pointer size-9">
        <AvatarFallback />
      </Avatar>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage src={'image' in user ? (user.image as string) || '' : ''} alt={user.name || user.email || ''} />
          <AvatarFallback>
            {getInitials(user.name, user.email)}
          </AvatarFallback>
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
          <Button type="submit" variant="ghost" className="w-full justify-start h-auto p-0 font-normal hover:bg-transparent">
            <DropdownMenuItem variant="destructive" className="w-full cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
