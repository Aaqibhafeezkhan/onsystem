"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { Settings, CreditCard, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/app/(login)/actions";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface UserMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onSignOut?: () => void;
}

export function UserMenu({ user: userProp, onSignOut }: UserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { data: swrUser } = useSWR(userProp === undefined ? "/api/user" : null, fetcher);
  const router = useRouter();

  const user = userProp !== undefined ? userProp : swrUser;

  async function handleSignOut() {
    if (onSignOut) {
      onSignOut();
      return;
    }
    await signOut();
    mutate("/api/user");
    router.push("/");
  }

  const getInitials = (u?: { name?: string | null; email?: string | null } | null) => {
    if (!u) return "";
    if (u.name) {
      return u.name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    if (u.email) {
      return u.email
        .split("@")[0]
        .split(/[\.\-_]/)
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return "";
  };

  const initials = getInitials(user);

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="cursor-pointer size-9">
          <AvatarImage src={user?.image || ""} alt={user?.name || user?.email || ""} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 flex flex-col gap-1">
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/pricing" className="flex w-full items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem variant="destructive" className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
