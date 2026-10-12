"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { signOut } from "@/app/(login)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type MenuUser = {
  name: string | null;
  email: string;
};

const fetcher = (url: string) => fetch(url).then((response) => response.json());

function getInitials(user?: MenuUser | null) {
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return initials.toUpperCase() || "U";
}

export function UserMenu() {
  const { data: user } = useSWR<MenuUser | null>("/api/user", fetcher);
  const router = useRouter();
  const initials = getInitials(user);

  async function handleSignOut() {
    await signOut();
    await mutate("/api/user", null, false);
    router.push("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Open ${user?.name || user?.email || "user"} menu`}
          className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/general" className="cursor-pointer">
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/pricing" className="cursor-pointer">
            Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
