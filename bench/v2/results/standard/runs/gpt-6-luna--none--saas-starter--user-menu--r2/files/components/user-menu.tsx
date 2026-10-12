"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { signOut } from "@/app/(login)/actions";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const fetcher = (url: string) => fetch(url).then((response) => response.json());

type MenuUser = {
  name: string | null;
  email: string;
};

function getInitials(user?: MenuUser) {
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "User";
  const words = displayName.split(/[\s._-]+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function UserMenu() {
  const { data: user } = useSWR<MenuUser | null>("/api/user", fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    await mutate("/api/user", null, { revalidate: false });
    router.push("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open user menu"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="size-9 cursor-pointer">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {getInitials(user ?? undefined)}
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
