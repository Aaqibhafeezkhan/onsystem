"use client";

import * as React from "react";
import { CreditCard, LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface UserMenuProps {
  /** Display name of the signed-in user, used to derive initials. */
  name?: string | null;
  /** Email address, used as a fallback source for initials. */
  email?: string | null;
  /** Called when "Sign out" is selected. */
  onSignOut?: () => void;
  onSettings?: () => void;
  onBilling?: () => void;
  className?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name?.trim() || email?.split("@")[0] || "").trim();
  if (!source) return "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return initials.toUpperCase();
}

function UserMenu({
  name,
  email,
  onSignOut,
  onSettings,
  onBilling,
  className,
}: UserMenuProps) {
  const initials = getInitials(name, email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        className={cn(
          "rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
          className
        )}
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuItem className="cursor-pointer" onSelect={onSettings}>
          <Settings />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onSelect={onBilling}>
          <CreditCard />
          <span>Billing</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onSelect={onSignOut}
        >
          <LogOut />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
export default UserMenu;
