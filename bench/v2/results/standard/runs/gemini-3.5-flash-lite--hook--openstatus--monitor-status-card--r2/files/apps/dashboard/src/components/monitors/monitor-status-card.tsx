"use client";

import type React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";
import { cn } from "@openstatus/ui/lib/utils";

import { StatusBadge } from "@/components/common/status-badge";
import { formatDistanceToNowShort } from "@/lib/formatter";

export interface MonitorStatusCardProps extends React.ComponentProps<typeof Card> {
  name?: string;
  url?: string;
  status?: "up" | "down" | "degraded" | "active" | "error" | "warning" | string;
  lastCheck?: string | Date | number;
  onPause?: () => void;
  monitor?: {
    name?: string;
    url?: string;
    status?: string;
    lastCheck?: string | Date | number;
  };
}

function formatLastCheck(lastCheck?: string | Date | number): string {
  if (!lastCheck) return "Never";
  if (typeof lastCheck === "string") return lastCheck;
  if (typeof lastCheck === "number") {
    return formatDistanceToNowShort(new Date(lastCheck));
  }
  if (lastCheck instanceof Date) {
    return formatDistanceToNowShort(lastCheck);
  }
  return String(lastCheck);
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheck,
  onPause,
  monitor,
  className,
  ...props
}: MonitorStatusCardProps) {
  const monitorName = name ?? monitor?.name ?? "Monitor";
  const monitorUrl = url ?? monitor?.url ?? "";
  const rawStatus = (status ?? monitor?.status ?? "up").toLowerCase();
  const monitorLastCheck = lastCheck ?? monitor?.lastCheck;

  let statusVariant: "success" | "warning" | "destructive" = "success";
  let statusLabel = "Up";

  if (["up", "active", "normal", "success"].includes(rawStatus)) {
    statusVariant = "success";
    statusLabel = "Up";
  } else if (["down", "error", "failing", "destructive"].includes(rawStatus)) {
    statusVariant = "destructive";
    statusLabel = "Down";
  } else if (["degraded", "warning"].includes(rawStatus)) {
    statusVariant = "warning";
    statusLabel = "Degraded";
  } else {
    statusLabel = status ?? monitor?.status ?? "Unknown";
  }

  return (
    <Card
      className={cn("group relative w-full gap-4 py-4 shadow-none", className)}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-2">
        <CardTitle className="text-base font-medium truncate pr-2">
          {monitorName}
        </CardTitle>
        <StatusBadge variant={statusVariant} dot>
          {statusLabel}
        </StatusBadge>
      </CardHeader>
      <CardContent className="px-4 text-sm text-muted-foreground space-y-1">
        {monitorUrl ? (
          <div className="truncate font-mono text-xs text-muted-foreground/80">
            {monitorUrl}
          </div>
        ) : null}
        <div className="text-xs">
          Last checked: {formatLastCheck(monitorLastCheck)}
        </div>
      </CardContent>
      <CardFooter className="px-4 pt-2">
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
