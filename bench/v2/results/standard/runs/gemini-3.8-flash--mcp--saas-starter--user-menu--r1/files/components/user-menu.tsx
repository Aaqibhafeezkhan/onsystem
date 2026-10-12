"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface UserMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  initials?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void;
  className?: string;
  align?: "start" | "center" | "end";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function getInitials(
  initials?: string,
  name?: string | null,
  email?: string | null,
  user?: { name?: string | null; email?: string | null } | null
): string {
  if (initials) return initials;
  const fullName = name ?? user?.name;
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  const fullEmail = email ?? user?.email;
  if (fullEmail && fullEmail.trim()) {
    const localPart = fullEmail.trim().split("@")[0];
    return localPart.slice(0, 2).toUpperCase();
  }
  return "JD";
}

export function UserMenu({
  user,
  initials,
  name,
  email,
  image,
  onSettings,
  onBilling,
  onSignOut,
  className,
  align = "end",
  open,
  defaultOpen,
  onOpenChange,
}: UserMenuProps = {}) {
  const displayInitials = getInitials(initials, name, email, user);
  const imageSrc = image ?? user?.image ?? undefined;
  const displayName = name ?? user?.name ?? "User";

  return (
    <DropdownMenu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full", className)}
        >
          <Avatar>
            {imageSrc ? (
              <AvatarImage src={imageSrc} alt={displayName} />
            ) : null}
            <AvatarFallback>{displayInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <DropdownMenuItem onClick={onSettings} onSelect={onSettings}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onBilling} onSelect={onBilling}>
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="text-destructive"
          onClick={onSignOut}
          onSelect={onSignOut}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
