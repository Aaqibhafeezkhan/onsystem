"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, CreditCard, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/(login)/actions";
import { User } from "@/lib/db/schema";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserMenuProps {
  user?: User | { name?: string | null; email?: string | null; image?: string | null };
  name?: string | null;
  email?: string | null;
  image?: string | null;
  onSignOut?: () => void | Promise<void>;
}

export function UserMenu({
  user: userProp,
  name: nameProp,
  email: emailProp,
  image: imageProp,
  onSignOut,
}: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const shouldFetch = !userProp && nameProp === undefined && emailProp === undefined;
  const { data: fetchedUser } = useSWR<User>(shouldFetch ? '/api/user' : null, fetcher);
  const router = useRouter();

  const user = userProp || fetchedUser;
  const name = nameProp !== undefined ? nameProp : user?.name;
  const email = emailProp !== undefined ? emailProp : user?.email;
  const image = imageProp !== undefined ? imageProp : (user as any)?.image;

  async function handleSignOut() {
    if (onSignOut) {
      await onSignOut();
      return;
    }
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  const getInitials = (n?: string | null, e?: string | null) => {
    if (n) {
      return n
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (e) {
      return e
        .split('@')[0]
        .split(/[\s_.-]/)
        .map((part) => part[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };

  const initials = getInitials(name, email);

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage src={image || undefined} alt={name || email || ''} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/general" className="flex w-full cursor-pointer items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/pricing" className="flex w-full cursor-pointer items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem
              variant="destructive"
              className="w-full flex-1 cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4 text-destructive" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
