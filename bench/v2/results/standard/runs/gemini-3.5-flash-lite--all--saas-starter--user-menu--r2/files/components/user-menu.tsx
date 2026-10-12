"use client";

import * as React from "react";
import Link from "next/link";
import { Settings, CreditCard, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UserMenuProps extends React.ComponentProps<typeof DropdownMenu> {
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
  signOutAction?: () => void | Promise<void>;
  className?: string;
}

export function UserMenu({
  user,
  name: propName,
  email: propEmail,
  avatarUrl: propAvatarUrl,
  initials: propInitials,
  settingsHref = "/dashboard/settings",
  billingHref = "/dashboard/billing",
  onSettings,
  onBilling,
  onSignOut,
  signOutAction,
  className,
  ...props
}: UserMenuProps) {
  const name = propName ?? user?.name;
  const email = propEmail ?? user?.email;
  const avatarUrl = propAvatarUrl ?? user?.image;

  const initials =
    propInitials ||
    (name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : email
      ? email.split("@")[0].slice(0, 2).toUpperCase()
      : "U");

  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full size-9 p-0", className)}
          aria-label="User menu"
        >
          <Avatar className="size-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name || email || "User avatar"} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {onSettings ? (
          <DropdownMenuItem onClick={onSettings} className="cursor-pointer">
            <Settings className="mr-2 size-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={settingsHref} className="flex w-full items-center">
              <Settings className="mr-2 size-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        )}

        {onBilling ? (
          <DropdownMenuItem onClick={onBilling} className="cursor-pointer">
            <CreditCard className="mr-2 size-4" />
            <span>Billing</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={billingHref} className="flex w-full items-center">
              <CreditCard className="mr-2 size-4" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {signOutAction ? (
          <form action={signOutAction} className="w-full">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start px-2 py-1.5 h-auto text-sm text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 cursor-pointer font-normal"
            >
              <LogOut className="mr-2 size-4" />
              <span>Sign out</span>
            </Button>
          </form>
        ) : onSignOut ? (
          <DropdownMenuItem variant="destructive" onClick={onSignOut} className="cursor-pointer">
            <LogOut className="mr-2 size-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" className="cursor-pointer">
            <LogOut className="mr-2 size-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
