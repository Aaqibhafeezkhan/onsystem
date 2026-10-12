"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";

import { signOut } from "@/app/(login)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/db/schema";

const fetcher = (url: string) => fetch(url).then((response) => response.json());

function getInitials(user?: Pick<User, "name" | "email"> | null) {
  const displayName = user?.name?.trim() || user?.email?.trim() || "User";
  const parts = displayName.split(/[\s@._-]+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function UserMenu() {
  const { data: user } = useSWR<User | null>("/api/user", fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate("/api/user", null, false);
    router.push("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open user menu"
          className="size-9 rounded-full p-0"
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/general">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/pricing">Billing</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => void handleSignOut()}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
