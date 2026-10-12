"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserMenuProps = {
  name: string;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void;
};

export function UserMenu({
  name,
  onSettings,
  onBilling,
  onSignOut,
}: UserMenuProps) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.length
    ? `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ""}`.toUpperCase()
    : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={name.trim() ? `Open user menu for ${name.trim()}` : "Open user menu"}
        >
          <Avatar className="size-9" aria-hidden="true">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onSettings}>Settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={onBilling}>Billing</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
