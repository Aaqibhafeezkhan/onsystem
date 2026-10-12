"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type UserMenuProps = {
  initials: string;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void;
};

export function UserMenu({
  initials,
  onSettings,
  onBilling,
  onSignOut
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Open user menu"
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem onSelect={onSettings}>Settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={onBilling}>Billing</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
