"use client";

import * as React from "react";
import { CreditCard, LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void;
  className?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "?";
  const parts = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((part) => part[0].toUpperCase()).join("") || "?";
}

function UserMenu({
  name,
  email,
  image,
  onSettings,
  onBilling,
  onSignOut,
  className,
}: UserMenuProps) {
  const initials = getInitials(name, email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:ring-[3px] data-[state=open]:ring-ring/50",
          className
        )}
        aria-label="Open user menu"
      >
        <Avatar className="size-9">
          {image ? <AvatarImage src={image} alt={name ?? email ?? ""} /> : null}
          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onSettings?.()}>
          <Settings />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onBilling?.()}>
          <CreditCard />
          <span>Billing</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onSignOut?.()}>
          <LogOut />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
