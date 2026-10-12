'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { Settings, CreditCard, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserMenuProps {
  user?: User | { name?: string | null; email?: string | null; image?: string | null } | null;
  settingsHref?: string;
  billingHref?: string;
  onSignOut?: () => void | Promise<void>;
}

export function UserMenu({
  user: userProp,
  settingsHref = '/dashboard/general',
  billingHref = '/pricing',
  onSignOut,
}: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: swrUser } = useSWR(userProp === undefined ? '/api/user' : null, fetcher);
  const router = useRouter();

  const user = userProp !== undefined ? userProp : swrUser;

  async function handleSignOut() {
    if (onSignOut) {
      await onSignOut();
    } else {
      await signOut();
      mutate('/api/user');
      router.push('/');
    }
  }

  const name = user?.name;
  const email = user?.email;
  const image = user?.image;

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email
    ? email
        .split('@')[0]
        .split(/[\s_.-]+/)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage src={image || ''} alt={name || email || ''} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1 w-48">
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={settingsHref} className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={billingHref} className="flex w-full items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem
              variant="destructive"
              className="w-full flex-1 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
