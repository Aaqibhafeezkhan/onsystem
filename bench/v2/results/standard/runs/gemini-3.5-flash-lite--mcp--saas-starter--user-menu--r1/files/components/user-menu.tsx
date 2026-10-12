'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, CreditCard, LogOut } from 'lucide-react';
import { signOut } from '@/app/(login)/actions';
import useSWR, { mutate } from 'swr';
import { User } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserMenuProps {
  user?: User | { name?: string | null; email?: string | null; image?: string | null } | null;
  onSignOut?: () => void | Promise<void>;
  settingsHref?: string;
  billingHref?: string;
}

export function UserMenu({
  user: userProp,
  onSignOut,
  settingsHref = '/dashboard/general',
  billingHref = '/pricing',
}: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: fetchedUser } = useSWR<User>(
    userProp === undefined ? '/api/user' : null,
    fetcher
  );
  const router = useRouter();

  const user = userProp !== undefined ? userProp : fetchedUser;

  async function handleSignOut() {
    if (onSignOut) {
      await onSignOut();
    } else {
      await signOut();
      mutate('/api/user');
      router.push('/');
    }
  }

  if (!user) {
    return null;
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email
        .split('@')[0]
        .split(/[\s_.-]/)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };

  const initials = getInitials(user.name, user.email);
  const image = 'image' in user ? (user.image ?? '') : '';

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="cursor-pointer size-9">
          <AvatarImage src={image} alt={user.name || user.email || ''} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            handleSignOut();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
