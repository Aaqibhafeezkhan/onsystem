"use client";

import { signOut } from "@/app/(login)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { User } from "@/lib/db/schema";
import { CreditCard, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((response) => response.json());

type UserMenuUser = Pick<User, "name" | "email">;

export function UserMenu() {
  const { data: user } = useSWR<UserMenuUser | null>("/api/user", fetcher);
  const router = useRouter();

  if (!user) return null;

  const displayName = user.name?.trim() || user.email;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    await mutate("/api/user", null, { revalidate: false });
    router.push("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-full p-0"
          aria-label={`Open user menu for ${displayName}`}
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem asChild>
          <a href="/dashboard/settings">
            <Settings />
            <span>Settings</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/dashboard/pricing">
            <CreditCard />
            <span>Billing</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
