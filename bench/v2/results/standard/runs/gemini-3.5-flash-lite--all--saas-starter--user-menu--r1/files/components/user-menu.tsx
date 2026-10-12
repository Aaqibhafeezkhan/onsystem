"use client";

import * as React from "react";
import Link from "next/link";
import { Settings, CreditCard, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface UserMenuProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenu> {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  initials?: string;
  settingsHref?: string;
  billingHref?: string;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void;
  className?: string;
}

export function UserMenu({
  user,
  name,
  email,
  avatarUrl,
  initials,
  settingsHref = "/settings",
  billingHref = "/billing",
  onSettings,
  onBilling,
  onSignOut,
  className,
  ...props
}: UserMenuProps) {
  const displayName = name || user?.name;
  const displayEmail = email || user?.email;
  const displayAvatar = avatarUrl || user?.image;

  const calculatedInitials =
    initials ||
    (displayName
      ? displayName
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : displayEmail
      ? displayEmail[0].toUpperCase()
      : "U");

  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="User menu"
          className={cn("rounded-full", className)}
        >
          <Avatar className="cursor-pointer size-9">
            <AvatarImage
              src={displayAvatar || undefined}
              alt={displayName || ""}
            />
            <AvatarFallback>{calculatedInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className="cursor-pointer" onClick={onSettings}>
          {settingsHref ? (
            <Link href={settingsHref} className="flex w-full items-center gap-2">
              <Settings className="size-4" />
              <span>Settings</span>
            </Link>
          ) : (
            <>
              <Settings className="size-4" />
              <span>Settings</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={onBilling}>
          {billingHref ? (
            <Link href={billingHref} className="flex w-full items-center gap-2">
              <CreditCard className="size-4" />
              <span>Billing</span>
            </Link>
          ) : (
            <>
              <CreditCard className="size-4" />
              <span>Billing</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={onSignOut}
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
