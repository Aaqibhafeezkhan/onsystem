"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";
import { cn } from "@openstatus/ui/lib/utils";
import type * as React from "react";

import { StatusBadge } from "@/components/common/status-badge";
import { formatDistanceToNowShort } from "@/lib/formatter";

export interface MonitorStatusCardProps
  extends React.ComponentProps<typeof Card> {
  monitor?: {
    name?: string;
    url?: string;
    status?: string;
    lastCheck?: Date | string | number | null;
    lastCheckedAt?: Date | string | number | null;
    active?: boolean;
    [key: string]: any;
  };
  name?: string;
  url?: string;
  status?: string;
  lastCheck?: Date | string | number | null;
  lastCheckedAt?: Date | string | number | null;
  onPause?: () => void;
}

export function MonitorStatusCard({
  monitor,
  name: nameProp,
  url: urlProp,
  status: statusProp,
  lastCheck: lastCheckProp,
  lastCheckedAt: lastCheckedAtProp,
  onPause,
  className,
  ...props
}: MonitorStatusCardProps) {
  const name = nameProp ?? monitor?.name ?? "Monitor";
  const url = urlProp ?? monitor?.url ?? "";
  const rawStatus =
    statusProp ??
    monitor?.status ??
    (monitor?.active === false ? "inactive" : "active");
  const rawLastCheck =
    lastCheckProp ??
    lastCheckedAtProp ??
    monitor?.lastCheck ??
    monitor?.lastCheckedAt;

  const getStatusDetails = (s: string) => {
    switch (s.toLowerCase()) {
      case "active":
      case "up":
      case "success":
        return { variant: "success" as const, label: "Up" };
      case "error":
      case "down":
      case "failed":
      case "destructive":
        return { variant: "destructive" as const, label: "Down" };
      case "degraded":
      case "warning":
        return { variant: "warning" as const, label: "Degraded" };
      default:
        return { variant: "default" as const, label: s || "Unknown" };
    }
  };

  const statusInfo = getStatusDetails(String(rawStatus));

  let lastCheckDisplay = "Never";
  if (rawLastCheck) {
    try {
      const date =
        rawLastCheck instanceof Date ? rawLastCheck : new Date(rawLastCheck);
      if (!Number.isNaN(date.getTime())) {
        lastCheckDisplay = formatDistanceToNowShort(date);
      } else if (typeof rawLastCheck === "string") {
        lastCheckDisplay = rawLastCheck;
      }
    } catch {
      lastCheckDisplay = String(rawLastCheck);
    }
  }

  return (
    <Card className={cn("relative overflow-hidden", className)} {...props}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="space-y-1 min-w-0 flex-1">
          <CardTitle className="truncate font-medium text-base">
            {name}
          </CardTitle>
          {url && (
            <CardDescription className="truncate font-mono text-xs">
              {url}
            </CardDescription>
          )}
        </div>
        <CardAction className="flex items-center gap-2 shrink-0">
          <StatusBadge variant={statusInfo.variant} dot>
            {statusInfo.label}
          </StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-2 pb-4 text-xs text-muted-foreground">
        <div>
          Last check:{" "}
          <span className="font-medium text-foreground">
            {lastCheckDisplay}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onPause} type="button">
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
