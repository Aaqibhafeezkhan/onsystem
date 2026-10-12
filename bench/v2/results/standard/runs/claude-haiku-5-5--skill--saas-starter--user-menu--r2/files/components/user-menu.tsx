"use client";

import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type UserMenuProps = {
  user: {
    name?: string | null;
    email: string;
  };
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void;
};

function getInitials(user: UserMenuProps["user"]): string {
  const source = user.name?.trim() || user.email.trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return initials.toUpperCase();
}

export function UserMenu({
  user,
  onSettings,
  onBilling,
  onSignOut,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        className="cursor-pointer rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="size-9">
          <AvatarFallback>{getInitials(user)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem className="cursor-pointer" onSelect={onSettings}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onSelect={onBilling}>
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onSelect={onSignOut}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
