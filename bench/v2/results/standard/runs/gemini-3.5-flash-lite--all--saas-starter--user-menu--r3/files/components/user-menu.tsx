"use client";

import * as React from "react";
import Link from "next/link";
import { Settings, CreditCard, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export interface UserMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
  onSettings?: () => void;
  onBilling?: () => void;
  onSignOut?: () => void;
  settingsHref?: string;
  billingHref?: string;
}

function getInitials(name?: string | null, email?: string | null) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    const localPart = email.trim().split("@")[0];
    const parts = localPart.split(/[\s._-]+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return localPart.slice(0, 2).toUpperCase();
  }
  return "U";
}

export function UserMenu({
  user,
  name: nameProp,
  email: emailProp,
  image: imageProp,
  avatarUrl,
  onSettings,
  onBilling,
  onSignOut,
  settingsHref = "/dashboard/general",
  billingHref = "/pricing",
}: UserMenuProps) {
  const name = user?.name ?? nameProp;
  const email = user?.email ?? emailProp;
  const image = user?.image ?? imageProp ?? avatarUrl;

  const initials = getInitials(name, email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full size-9 p-0 overflow-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="size-full">
            {image && <AvatarImage src={image} alt={name || email || "User avatar"} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {name || email ? (
          <>
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
              <div className="flex flex-col space-y-1 truncate">
                {name && <p className="font-medium text-foreground truncate">{name}</p>}
                {email && <p className="truncate">{email}</p>}
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        ) : null}

        <DropdownMenuItem
          className="cursor-pointer"
          onClick={onSettings}
          asChild={!onSettings}
        >
          {onSettings ? (
            <span className="flex w-full items-center">
              <Settings className="mr-2 size-4" />
              <span>Settings</span>
            </span>
          ) : (
            <Link href={settingsHref} className="flex w-full items-center">
              <Settings className="mr-2 size-4" />
              <span>Settings</span>
            </Link>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer"
          onClick={onBilling}
          asChild={!onBilling}
        >
          {onBilling ? (
            <span className="flex w-full items-center">
              <CreditCard className="mr-2 size-4" />
              <span>Billing</span>
            </span>
          ) : (
            <Link href={billingHref} className="flex w-full items-center">
              <CreditCard className="mr-2 size-4" />
              <span>Billing</span>
            </Link>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={onSignOut}
        >
          <LogOut className="mr-2 size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
