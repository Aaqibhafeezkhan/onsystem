"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, CreditCard, Settings } from "lucide-react";

import { signOut } from "@/app/(login)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  className?: string;
};

function getInitials(user?: UserMenuProps["user"]): string {
  const source = user?.name?.trim() || user?.email?.trim() || "";
  if (!source) return "?";

  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return initials.toUpperCase() || "?";
}

export function UserMenu({ user, className }: UserMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        className={cn(
          "inline-flex shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          className
        )}
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard/general">
            <Settings />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/pricing">
            <CreditCard />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onSelect={() => {
            void handleSignOut();
          }}
        >
          <LogOut />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
